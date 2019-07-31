const connection = require('./connection').config;
const customerManager=require('./clientsManager');
const agencyManager=require('./agencesManager');
const uuidv4=require('uuid/v4');

function ComptesManagerBuilder(){
    
    return {
        createCustomerAccount(session,agency='',{customerCode='',amount=1}){
            return new Promise((resolve,reject)=>{
                ///Define doc
                console.log('Create Customer Account');
                // Validate Data
                if(agency && customerCode && amount>0){
                    console.log("Great");
                    /// STEP-1:  Check if the given agency exists in store
                    let schema = session.getSchema(connection.database);
                    let customers= schema.getCollection('customers');
                    let accounts = schema.getCollection('accounts');
                    let agency_doc=null;
                    let agency_account=null;
                    let customer_doc=null;

                   let gen_id;
                    let matchedDocs=[];
                    agencyManager().readByRef(session,agency)
                    .then((ag)=>{
                        agency_doc=ag;
                        if(agency_doc && agency_doc['_id']){
                            //OK done ! we have got an agency matching the given reference
                            // STEP 2: check if the given customer exists and also fetch the agency account

                            console.log("Promise.all()");
                            console.log(customerCode);
                            console.log(agency_doc);
                            return Promise.all([
                                customerManager()
                                .readByCustomerCode(session,customerCode),

                                accounts
                                .find("agency=:ag AND type='BUSINESS'")
                                .bind("ag",agency_doc['_id'])
                                .execute((_)=>{
                                    agency_account=_;
                                })
                            ]);
                        }
                        reject();
                    })
                    .then(([cus,r])=>{

                        console.log("After promise");
                        if(cus)customer_doc=cus;
                        if(customer_doc && customer_doc['_id']){
                            // Ok done ! the given customer code matches a customer
                            //Step 3: check if the given customer Already have an account 
                            console.log("Great twice");
                            return accounts.find("customer=:cs AND type='CUSTOMER' AND agency=:ag")
                            .bind('cs',customer_doc['_id'])
                            .bind('ag',agency_doc['_id'])
                            .execute((rw)=>{
                                matchedDocs.push(rw);
                            })
                        }else{
                            console.log('Failed to check customer');
                            reject();
                        }
                    })
                    .then((matched)=>{
                        console.log(matched);
                        session.startTransaction();
                        if(matchedDocs.length<=0){
                            let doc={
                                type:'CUSTOMER',
                                agency:agency_doc['_id'],
                                customer:customer_doc['_id'],
                                amount:0,
                                creationDate:Date.now()
                            }
                            console.log("creating doc");
                            return accounts.add(doc).execute();
                        }else{
                            reject();
                        }
                    })
                    .then((rw2)=>{
                        console.log(rw2);
                        if(rw2.getGeneratedIds() && rw2.getGeneratedIds()[0]) gen_id=rw2.getGeneratedIds()[0];
                        console.log(gen_id);
                        return this.transact(session,{from:agency_account['_id'],to:gen_id,amount:amount})
                    })
                    .then((res)=>{
                        return session.commit();
                    })
                    .then(()=>{
                        resolve();
                    })
                    .catch((err)=>{
                        console.log(err);
                        console.log('Failed to create account')
                        reject(err);
                    })
                }
                else{
                    reject({message:'Validation failed'})
                }
            })
        },

        readTransactionByRef(session,ref){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session
                .getSchema(connection.database)
                .getCollection("transactions")
                .find("_id=:id")
                .bind("id",ref)
                .execute((row)=>{
                    doc=row;
                })
                .then((rs)=>{
                    resolve(doc);
                })
                .catch(err=>{
                    reject(err);
                })
            })
        },

        readTransactionsOfAccount(session,ref=''){
            return new Promise((resolve,reject)=>{
                let docs=[];
                session
                .getSchema(connection.database)
                .getCollection("transactions")
                .find("debited.ref=:ref OR credited.ref=:rf")
                .bind("ref",ref)
                .bind('rf',ref)
                .execute((row)=>{
                    docs.push(row);
                })
                .then((rs)=>{
                    resolve(docs);
                })
                .catch(err=>{
                    reject(err);
                })
            })
        },

        transact(session,{from='',to='',amount=0,reason=''}){
            console.log(`Starting transfert of ${amount} XOF from ${from} to ${to} at ${Date.now().toString()}`);
            return new Promise((resolve,reject)=>{
                // Amount have to be positive number
                if(amount<=0){
                    reject();
                }
                amount=parseFloat(amount);
                let schema=session.getSchema(connection.database)
                let accounts=schema.getCollection("accounts");
                let transactions = schema.getCollection('transactions');
                
                let account_to_debit=null;
                let account_to_credit=null;
    
                Promise.all([
                    accounts.find("_id=:id").bind("id",from).execute((ac)=>{account_to_debit=ac;}),
                    accounts.find("_id=:id").bind("id",to).execute((row)=>{account_to_credit=row;})
                ])
                .then(([r1,r2])=>{
                    console.log(account_to_credit);
                    console.log(account_to_debit);
                    /// Perfect ! we have [from] and [to] .
                    if(account_to_debit && account_to_credit  && (account_to_debit.amount > amount)){
                        /// Ok Good 
                        session.startTransaction();
                        account_to_debit.amount-=amount;
                        account_to_debit.lastOperationDate=Date.now();
                        /// Debit the amount from [from] account
                        account_to_credit.amount+=amount; /// Credit the [to] with the withdrawn amount
                        account_to_credit.lastOperationDate=Date.now();

                        console.log("Modifying");
                        return accounts.modify("_id=:val")
                        .bind("val",account_to_debit['_id'])
                        .patch(account_to_debit)
                        .execute();
                    }else{
                        reject();
                    }
                }) 
                .then((rs)=>{
                    if( rs && rs.getAffectedItemsCount()>0){
                        return;
                    }else{
                        reject();
                    }
                })
                .then(()=>{
                    return accounts.modify("_id=:val")
                    .bind("val",account_to_credit['_id'])
                    .patch(account_to_credit)
                    .execute();
                })
                .then((rs)=>{
                    console.log(rs);
                    if(rs.getAffectedItemsCount()>0){
                        // Good news . The transaction has succeeded!
                                    /// Next Step: Persist Transaction document in the transactions collections
                        let transDoc={
                            amount:amount,
                            reason:reason,
                            debited:{
                                ref:account_to_debit['_id'],
                                type:account_to_debit['type']
                            },
                            credited:{
                                ref:account_to_credit['_id'],
                                type:account_to_credit['type']
                            },
                            date:Date.now()
                        }
                        return transactions.add(transDoc).execute();
                    }else{
                        return 
                    }
                })
                .then((r1)=>{
                    if(r1){
                        return session.commit()
                        .then(()=>{
                            return r1;
                        })
                    }else{
                        reject();
                    }
                })
                .then((r)=>{
                    resolve(r.getGeneratedIds()[0]);
                })
                .catch((err)=>{
                    session.rollback();
                    reject(err);
                })
            })
        },

        read(session,id=''){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session
                .getSchema(connection.database)
                .getCollection("accounts")
                .find("_id=:id")
                .bind("id",id)
                .execute((row)=>{
                    doc=row;
                })
                .then((rs)=>{
                    resolve(doc);
                })
            })
        },

        readAll(session){
            return new Promise((resolve,reject)=>{
                let docs=[];
                session
                .getSchema(connection.database)
                .getCollection("accounts")
                .find()
                .execute((row)=>{
                    docs.push(row);
                })
                .then((rs)=>{
                    resolve(docs);
                })
            })
        },

        readBufferAccountDetails(session){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session
                .getSchema(connection.database)
                .getCollection("accounts")
                .find("type='BUFFER' AND standalone=true")
                .execute((row)=>{
                    doc=row;
                })
                .then((rs)=>{
                    if(doc){
                        resolve(doc);
                    }else{
                        reject();
                    } 
                })
            })
        },

        readAgencyAccountDetails(session,agencyRef){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session
                .getSchema(connection.database)
                .getCollection("accounts")
                .find("type='BUSINESS' AND agency=:ref")
                .bind("ref",agencyRef)
                .execute((row)=>{
                    doc=row;
                })
                .then((rs)=>{
                    if(doc){
                        resolve(doc);
                    }else{
                        reject();
                    } 
                })
            })
        },

        readClientAccountsForAgency(session,idagence=''){
            return new Promise((resolve,reject)=>{
                // Retrieve accounts and customers identity datas.
                let docs=[];
                let schema=session.getSchema(connection.database)
                let accounts=schema.getCollection("accounts");
                let customers=schema.getCollection("customers");
                let dcs=accounts.find("agency=:agency AND type='CUSTOMER'")
                .bind("agency",idagence)
                .execute((row)=>{
                    docs.push({...row});
                })
                .then((_)=>{
                    return Promise.all(docs.map((doc,idx)=>{
                        return new Promise((res,rej)=>{
                            customerManager().readByRef(session,doc['customer'])
                            .then((customer)=>{
                                res({...doc,identity:customer.identity});
                            })
                        })
                    }))
                })
                .then((mapped)=>{
                    resolve(mapped);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        readAccountsWhereClientIs(session,client=''){
            return new Promise((resolve,reject)=>{
                let docs=[];
                session
                .getSchema(connection.database)
                .getCollection("accounts")
                .find("customer=:cus && type='CUSTOMER'")
                .bind("cus",client)
                .execute((row)=>{
                    docs.push(row);
                })
                .then((rs)=>{
                    resolve(docs);
                })
                .catch((err)=>{
                    console.log(err);
                    reject(err);
                })
            })
        },

        checkIfAccountIsOwnedByCustomer(session,accountRef,customerRef){
            return new Promise((resolve,reject)=>{
                let doc=null;
                this.read(session,accountRef)
                .then((doc)=>{
                    if(doc.type==='CUSTOMER' && doc.customer===customerRef){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                })
                .catch(err=>{
                    reject(err);
                })
            })
        },

        updateCustomerAccount(session,id='',obj={}){
            return new Promise((resolve,reject)=>{
                let doc={}
                if(obj.amount) doc.amount=obj.amount;
                let docs=[];
                let schema=session.getSchema(connection.database)
                let accounts=schema.getCollection("accounts");
                /// TODO: Add obj validation !!!
                accounts.modify("_id=:id AND type='CUSTOMER'")
                .bind("id",id)
                .patch(doc)
                .execute()
                .then((rs)=>{
                    resolve(rs);
                })
                .catch((err)=>{
                    console.log(err);
                    reject(err);
                })
            })
        },

        creditCustomerAccount(session,id='',amount){
            console.log(id);
            console.log(amount);
            return new Promise((resolve,reject)=>{
                let accounts = session.getSchema(connection.database).getCollection("accounts");
                let agencyId='';
                let agency_account_id='';
                // FETCH The agency from the given customer account
                accounts.find("_id=:id AND type='CUSTOMER'")
                .bind('id',id)
                .execute((row)=>{
                    agencyId=row['agency'];
                })
                .then(()=>{
                    if(id && agencyId){
                        // FETCH The agency account 
                        let accounts = session.getSchema(connection.database).getCollection("accounts");
                        return accounts.find("agency=:id AND type='BUSINESS'")
                        .bind('id',agencyId)
                        .execute((row)=>{
                            agency_account_id=row['_id'];
                        })
                    }else{
                        reject();
                    }
                })
                .then((_)=>{
                    if(id && agency_account_id){
                        return this.transact(session,{to:id,from:agency_account_id,amount:amount});
                    }else{
                        reject();
                    }
                })
                .then(()=>{
                    resolve();
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        debitCustomerAccount(session,id='',amount){
            console.log(id);
            console.log(amount);
            return new Promise((resolve,reject)=>{
                let accounts = session.getSchema(connection.database).getCollection("accounts");
                let agencyId='';
                let agency_account_id='';
                // FETCH The agency from the given customer account
                accounts.find("_id=:id AND type='CUSTOMER'")
                .bind('id',id)
                .execute((row)=>{
                    agencyId=row['agency'];
                })
                .then(()=>{
                    if(id && agencyId){
                        // FETCH The agency account 
                        let accounts = session.getSchema(connection.database).getCollection("accounts");
                        return accounts.find("agency=:id AND type='BUSINESS'")
                        .bind('id',agencyId)
                        .execute((row)=>{
                            agency_account_id=row['_id'];
                        })
                    }else{
                        reject();
                    }
                })
                .then((_)=>{
                    if(id && agency_account_id){
                        return this.transact(session,{from:id,to:agency_account_id,amount:amount});
                    }else{
                        reject();
                    }
                })
                .then(()=>{
                    resolve();
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        freezeAccount(session,id=''){
            return new Promise((resolve,reject)=>{
                let doc={
                    state:'freezed',
                    freezedAt:Date.now()
                }
                let schema=session.getSchema(connection.database)
                let accounts=schema.getCollection("accounts");
                /// TODO: Add obj validation !!!
                accounts.modify("_id=:id")
                .bind("id",id)
                .patch(doc)
                .execute()
                .then((rs)=>{
                    resolve(rs);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        unFreezeAccount(session,id=''){
            return new Promise((resolve,reject)=>{
                let doc={
                    state:'active',
                    activatedAt:Date.now()
                }
                let schema=session.getSchema(connection.database)
                let accounts=schema.getCollection("accounts");
                /// TODO: Add obj validation !!!
                accounts.modify("_id=:id")
                .bind("id",id)
                .patch(doc)
                .execute()
                .then((rs)=>{
                    resolve(rs);
                })
                .catch((err)=>{
                    console.log(err);
                    reject(err);
                })
            })
        }
    };
}

module.exports= ComptesManagerBuilder;