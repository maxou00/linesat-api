const connection = require('./connection').config;
let customerManager=require('./clientsManager');
const uuidv4=require('uuid/v4');
let genAccountCode = require('../lib/helpers');
const txnType=require('../lib/constants').txnType;

function ComptesManagerBuilder(){
    
    return {
        /**
         * 
         * @param {Mysqlx.session} session 
         * @param {{}} param1 
         * @param {boolean} abortIfExist 
         * 
         * Create a new account for the given agency ID 
         */
        createAgencyAccount(session,agencyRef='',abortIfExist=true){
            return new Promise((resolve,reject)=>{
                
                let agencyAccountDoc={
                    type:"BUSINESS",
                    amount:0,
                    agency:agency,
                    code:genAccountCode(),
                    creationDate:Date.now()
                }

                let schema= session.getSchema(connection.database);
                let accounts= schema.getCollection("accounts");
                let defined=null;
                if(abortIfExist){
                    accounts.find("agency=:ag AND type='BUSINESS'")
                    .execute(r=>{
                        defined=r;
                    })
                    .then(rs=>{
                        if(defined){
                            reject("The given agency already have an account");
                        }
                    })
                }
                accounts.add(agencyAccountDoc).execute()
                .then(rs=>{
                    let ids=rs.getGeneratedIds();
                    if(ids){
                        resolve(ids[0]);
                    }
                })
            })
        },

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
                                code:genAccountCode(),
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

        readAccountByCode(session,code=''){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session
                .getSchema(connection.database)
                .getCollection("accounts")
                .find("code=:id")
                .bind("id",code)
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

        generateActivityForAccount(session,accountRef,{txnRef,txnType='DEBIT',amount=0,balanceBefore='',balanceAfter=''}){
            return new Promise((resolve,reject)=>{
                this.read(session,accountRef)
                .then((account)=>{
                    let doc={
                        account:accountRef,
                        txnRef:txnRef,
                        txnType:txnType,
                        amount:amount,
                        balanceBefore:balanceBefore,
                        balanceAfter:balanceAfter,
                        date:Date.now()
                    }
                    return session
                    .getSchema(connection.database)
                    .getCollection("accountActivity")
                    .add(doc)
                    .execute();
                })
                .then((rs)=>{
                    resolve(rs.getGeneratedIds()[0]);
                })
                .catch(err=>{
                    reject(err);
                })
            })
        },

        /**
         * @param {*} session 
         * @param {string} accountRef 
         * Read All known account activity
         */
        readActivityOfAccount(session,accountRef){
            return new Promise((resolve,reject)=>{
                let activities=[];
                session.getSchema(connection.database)
                .getCollection("accountActivity")
                .find("account=:acc")
                .bind("acc",accountRef)
                .execute((r)=>{
                    activities.push(r);
                })
                .then((rs)=>{
                    resolve(activities)
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        transact(session,{from='',to='',amount=0,reason=''}){
            console.log(`Starting transfert of ${amount} from ${from} to ${to} at ${Date.now().toString()}`);
            return new Promise((resolve,reject)=>{
                // Amount have to be positive number
                if(amount<=0){
                    reject("Amount is negative");
                }

                let ad_activity=null; // Activity Documents
                let ac_activity=null;
                let txnRef='';
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

                    /// right now let's reject transfers from accounts with different currencies.
                    /// we will add later multiple currency support.
                    
                    if(account_to_debit.currency !== account_to_credit.currency){
                        reject("Accounts don't share the same currency.");
                    }
                    /// Perfect ! we have [from] and [to] .
                    if(account_to_debit && account_to_credit  && (account_to_debit.amount > amount)){
                        /// Ok Good 
                        ad_activity={
                            txnType:txnType.DEBIT,
                            amount:`${amount} ${account_to_debit.currency}`,
                            balanceBefore:`${account_to_debit.amount} ${account_to_debit.currency}`,
                            balanceAfter:`${account_to_debit.amount - amount} ${account_to_debit.currency}`,
                            reason:reason
                        }

                        ac_activity={
                            txnType:txnType.CREDIT,
                            amount:`${amount} ${account_to_credit.currency}`,
                            balanceBefore:`${account_to_credit.amount} ${account_to_credit.currency}`,
                            balanceAfter:`${account_to_credit.amount + amount} ${account_to_credit.currency}`,
                            reason:reason
                        }

                        session.startTransaction();
                        account_to_debit.amount-=amount;
                        account_to_debit.lastOperationDate=Date.now();
                        /// Debit the amount from [from] account
                        account_to_credit.amount+=amount; /// Credit the [to] with the withdrawn amount
                        account_to_credit.lastOperationDate=Date.now();

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
                        txnRef=r1.getGeneratedIds()[0];
                        ad_activity.txnRef=txnRef;
                        ac_activity.txnRef=txnRef;
                        return Promise.all([
                            this.generateActivityForAccount(session,account_to_debit._id,ad_activity),
                            this.generateActivityForAccount(session,account_to_credit._id,ac_activity)
                        ])
                    }
                    else{
                        throw new Error("Transaction failed");
                    }
                })
                .then(([r1,r2])=>{
                    if(r1 && r2){
                        return session.commit()
                        .then(()=>{
                            return [r1,r2];
                        })
                    }else{
                        throw new Error("Activity not generated");
                    }
                })
                .then(([a1,a2])=>{
                    resolve(txnRef);
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
                .catch(reject);
            })
        },

        readBusinessAccounts(session){
            return new Promise((resolve,reject)=>{
                let docs=[];
                let agenciesIds=[];
                let schema = session
                .getSchema(connection.database);

                let accounts = schema.getCollection("accounts");
                let agencies= schema.getCollection('agencies');

                accounts.find("type='BUSINESS'")
                .execute((row)=>{
                    docs.push(row);
                })
                .then((r)=>{
                    /// Extract agencies list from docs list
                    docs.forEach((doc)=>{
                        if( ! agenciesIds.includes(doc.agency)){
                            agenciesIds.push(doc.agency);
                        }
                    })

                    /// Retrieve agencies documents from store
                    return Promise.all(
                        agenciesIds.map((ag)=>{
                            let agDoc=undefined;
                            return agencies
                            .find("_id=:id")
                            .bind('id',ag)
                            .execute((_)=>{
                                agDoc=_;
                            })
                            .then((r)=>{
                                return agDoc;
                            })
                        })
                    )
                })
                .then((dcs=[])=>{
                    /// Filter to remove possible cases where ther is an undefined value
                    return dcs.filter(dc=>dc!==undefined && dc !==null);
                })
                .then((ags=[])=>{
                    /// Map each account to its corresponding agency an return the built value
                    resolve(
                        docs.map((doc,idx)=>{
                            let agc= ags.find(ag=>ag._id===doc.agency);
                            if(agc){
                                doc.agencyIdentity=agc.identity
                            }
                            return doc;
                        })
                    );
                })
                .catch(reject);
            })
        },

        readCustomersAccount(session){
            return new Promise((resolve,reject)=>{
                let docs=[];
                let agenciesIds=[];
                let customersIds=[];
                let schema = session
                .getSchema(connection.database);

                let accounts = schema.getCollection("accounts");
                let agencies= schema.getCollection('agencies');
                let customers = schema.getCollection('customers');

                accounts.find("type='CUSTOMER'")
                .execute((row)=>{
                    docs.push(row);
                })
                .then((r)=>{
                    /// Extract agencies list from docs list
                    docs.forEach((doc)=>{
                        if(!agenciesIds.includes(doc.agency)){
                            agenciesIds.push(doc.agency);
                        }
                        if(!customersIds.includes(doc.customer)){
                            customersIds.push(doc.customer);
                        }
                    })
                    /// Retrieve agencies documents from store
                    return Promise.all(
                        [
                            Promise.all(
                                agenciesIds.map((ag)=>{
                                    let agDoc=undefined;
                                    return agencies
                                    .find("_id=:id")
                                    .bind('id',ag)
                                    .fields(['_id','identity'])
                                    .execute((_)=>{
                                        agDoc=_;
                                    })
                                    .then((r)=>{
                                        return agDoc;
                                    })
                                    .catch((err)=>{return undefined});
                                })
                            ),

                            Promise.all(
                                customersIds.map((cs)=>{
                                    let csD=undefined;
                                    return customers
                                    .find("_id=:id")
                                    .bind('id',cs)
                                    .fields(['_id','identity'])
                                    .execute((_)=>{
                                        csD=_;
                                    })
                                    .then((r)=>{
                                        return csD;
                                    })
                                    .catch((err)=>{return undefined});
                                })
                            )

                        ]
                        
                    )
                })
                .then(([ags=[],cuss=[]])=>{
                    /// Filter to remove possible cases where ther is an undefined value
                    return [
                        ags.filter(dc=>dc!==undefined && dc !==null),
                        cuss.filter(dc=>dc!==undefined && dc !==null)
                    ]
                })
                .then(([ags=[],cuss=[]])=>{
                    /// Map each account to its corresponding agency and customer an return the built value
                    let mapped=docs.map((doc,idx)=>{
                        console.log(ags);
                        let agc= ags.find(ag=>ag._id===doc.agency);
                        console.log(agc);
                        if(agc){
                            doc.agencyIdentity=agc.identity
                        }
                        console.log(cuss);
                        let cs= cuss.find(c=>c._id===doc.customer);
                        console.log(cs);
                        if(cs){
                            doc.customerIdentity=cs.identity;
                        }
                        return doc;
                    })
                    resolve(mapped) ;
                })
                .catch(reject);
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

        readRootAccountDetails(session){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session
                .getSchema(connection.database)
                .getCollection("accounts")
                .find("type='ROOT' AND standalone=true")
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