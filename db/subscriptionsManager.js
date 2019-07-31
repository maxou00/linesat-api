const connection = require('./connection').config;
const AccountsManager= require('./comptesManager')();
const BouquetsManager= require('./bouquetsManager')();
const CustomerManager= require('./clientsManager')();
const enums=require('./constants');

function  SubscriptionBuilder(){
    return {
        /**
         * @param {{}} obj 
         * obj example:{
         *     formula:'000005dbc45800399999908',
         *      duration:3,
         *      account:'2879789342789792378832978',
         *      card:'120-1932-93230-0-23',
         * }
         */

        createSubscription(session,obj={}){
            return new Promise((resolve,reject)=>{
                let schema= session.getSchema(connection.database);
                let subscriptions = schema.getCollection("subscriptions");
                let bouquet=null;
                let reason='';

                let subDoc={
                    agencyRef:'',
                    customerRef:'',
                    formula:null,
                    duration:obj.duration,
                    card:obj.card,
                    confirmTxnRef:'',
                    date:Date.now(),
                    state:enums.subscriptions.WAITING,// WAITING,ONGOING,DONE,ABORTED  
                };

                // First Step: Fetch the Agency ID using the given account
                AccountsManager.read(session,obj.account)
                .then((acc)=>{
                    subDoc.agencyRef=acc['agency'];
                    subDoc.customerRef=acc['customer'];
                    return; 
                })
                // Next : Fetch bouquet and Buffer account details
                .then(()=>{
                    return BouquetsManager.readByRef(session,obj.formula)
                })
                .then(bq=>{
                    bouquet=bq;
                    reason=`Subscription to ${bouquet.label} (${bouquet.pricing.price} ${bouquet.pricing.currency}) for ${obj.duration} ${bouquet.pricing.timeUnit} `;
                    if(bouquet.state==enums.bouquets.ACTIVE){
                        let fb={
                            ref:bouquet['_id'],
                            label:bouquet.label,
                            price:bouquet.pricing.price
                        }
                        subDoc.formula=fb;
                        return AccountsManager.readBufferAccountDetails(session)
                    }else{
                        reject("Impossible Subscription on this formula.");
                    }
                })
                .then((buffer)=>{
                    session.startTransaction();
                    return AccountsManager.transact(session,{from:obj.account,to:buffer['_id'],amount:bouquet.pricing.price*obj.duration,reason:reason})
                })
                .then((txnRef)=>{
                    console.log(txnRef);
                    subDoc.confirmTxnRef=txnRef;
                    if( subDoc.agencyRef && subDoc.customerRef && subDoc.formula && subDoc.duration && subDoc.confirmTxnRef && subDoc.card){
                        return subscriptions.add(subDoc).execute();
                    }else{
                        reject("Incomplete fields");
                    }
                })
                .then((rs)=>{
                    if(rs){
                        session.commit()
                        .then(()=>{
                            resolve(rs);
                        })
                    }else{
                        session.rollback();
                        reject();
                    }
                })
                .catch(err=>{
                    console.log(err);
                    session.rollback();
                    reject(err);
                })
            })
        },

        read(session,id=''){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session.getSchema(connection.database)
                .getCollection("subscriptions")
                .find("_id=:id")
                .bind("id",id)
                .execute((rw)=>{
                    doc=rw;
                })
                .then((rs)=>{
                    resolve(doc);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        readAll(){
            return new Promise((resolve,reject)=>{
                let docs=[];
                session.getSchema(connection.database)
                .getCollection("subscriptions")
                .find()
                .execute((rw)=>{
                    docs.push(rw);
                })
                .then((rs)=>{
                    resolve(docs);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        checkIfAgencyCanChangeStateOf(session,agencyRef,subscriptionRef){
            return new Promise((resolve,reject)=>{
                let doc=null;
                session.getSchema(connection.database)
                .getCollection("subscriptions")
                .find("_id=:id")
                .bind("id",subscriptionRef)
                .execute((rw)=>{
                    doc=rw;
                })
                .then((rs)=>{
                    if(doc.agencyRef===agencyRef){
                        resolve(true);
                    }
                    resolve(false);
                })
                .catch((err)=>{
                    resolve(false);
                })
            })
        },

        readSubscriptionsForAgency(session,agencyRef=''){
            return new Promise((resolve,reject)=>{
                let docs=[];
                let customers =  [];
                session.getSchema(connection.database)
                .getCollection("subscriptions")
                .find("agencyRef=:id")
                .bind("id",agencyRef)
                .execute((rw)=>{
                    docs.push(rw);
                    // If the customer associated to this doc isn't already saved in customer list
                    if(!(customers.find((cus)=>{cus===rw.customerRef}))){
                        customers.push(rw.customerRef);
                    }
                })
                .then((rs)=>{
                    Promise.all(customers.map((cus)=>{
                        return CustomerManager.readByRef(session,cus)
                        .then((c)=>{
                            return c;
                        })
                        .catch(err=>{
                            return;
                        });
                    }))
                    .then((customers)=>{
                        /// Customers Array may contain values like [null] or [undefined]. Lets remove them
                        let filtered= customers.filter((cs)=>(cs!=null && cs!=undefined));
                        let mapped= docs.map((doc)=>{
                            customer = filtered.find((cs)=>cs._id===doc.customerRef);
                            return {...doc,customer:customer.identity};
                        })
                        return mapped;
                    })
                    .then((subs)=>{
                        resolve(subs);
                    })
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        /**
         * 
         * @param {} session 
         * @param {*} accountRef 
         * 
         * Subscriptions document doesn't directly hold any information 
         * about the account from which money was withdrawn for confirmation.
         * There is an `agencyRef` field and the combination (agencyRef-customerRef) matches an account but it doesn't means 
         * that a subscription is only fulfilled by the agency were the account was created.
         * However, there is a field holding the transaction Reference.
         * Transaction docs hold account debited info and account credited info.
         * Therefore, the algorithm we are going to write will act like this:
         * - We know that each time there is a subscription done, a new confirmation transaction
         * document is inserted, having a reason like "Subscription to ...".
         * -Our filter will then search for cases where `$debited.ref` is the given `accountRef` 
         * and the reason is like `Subscription to %`
         * - Once fetched, we will constitute an array containing each retrieved transaction's Ref.
         * - Then, fetch subscriptions were the `confirmTxnRef` is in the constituted Array.
         */
        readSubscriptionsForCustomerByAccount(session,accountRef=''){
            return new Promise((resolve,reject)=>{
                let transRefs=[]; // array holding transactions Ref 
                let subList=[]; // array holding subscriptions 
                
                let schema= session.getSchema(connection.database);
                let transactions = schema.getCollection("transactions");
                let subscriptions= schema.getCollection("subscriptions");

                transactions.find("debited.ref=:account AND reason like 'Subscription to %'")
                .bind("account",accountRef)
                .execute((row)=>{
                    if(!(transRefs.includes(row._id))){
                        transRefs.push(row._id);
                    }
                })
                .then((r1)=>{
                    return Promise.all(transRefs.map((ref)=>{
                        let sub=null;
                        return subscriptions.find("confirmTxnRef=:ref")
                        .bind("ref",ref)
                        .execute((rw)=>{
                            sub=rw;
                        })
                        .then((rs)=>{
                            return sub;
                        })
                    }));
                    
                })
                .then((rs=[])=>{
                    let filtered=rs.filter((sub,idx)=>sub!=null);
                    resolve(filtered);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        setOngoing(session,subscriptionRef){
            return new Promise((resolve,reject)=>{
                let doc=null;
                let subs=session.getSchema(connection.database)
                .getCollection("subscriptions");
                subs
                .find("_id=:id")
                .bind("id",subscriptionRef)
                .execute((rw)=>{
                    doc=rw;
                })
                .then((rs)=>{
                    if(doc.state===enums.subscriptions.WAITING){
                        doc.state=enums.subscriptions.ONGOING;
                        doc.ongoingDate=Date.now();
                        session.startTransaction();
                        return subs.modify("_id=:id")
                        .bind("id",subscriptionRef)
                        .patch(doc)
                        .execute();
                    }
                    reject();
                })
                .then((rs)=>{
                    if(rs.getAffectedRowsCount()>0){
                        session.commit()
                        .then(()=>{
                            resolve(rs);
                        })
                    }else{
                        session.rollback();
                        reject();
                    }
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        setAborted(session,subscriptionRef){
            return new Promise((resolve,reject)=>{
                let doc=null;
                let subs=session.getSchema(connection.database)
                .getCollection("subscriptions");
                subs
                .find("_id=:id")
                .bind("id",subscriptionRef)
                .execute((rw)=>{
                    doc=rw;
                })
                .then((rs)=>{
                    if(doc.state===enums.subscriptions.WAITING || doc.state===enums.subscriptions.ONGOING){
                        /// Read the transaction that confirmed this submission.
                        return AccountsManager.readTransactionByRef(session,doc.confirmTxnRef)
                    }
                    reject();
                })
                .then((transaction)=>{
                    session.startTransaction();
                    
                    // Send back widthdrawn money to where it was.

                    let reason= `Sending Back ${transaction.amount} 
                                \n- To ${transaction.debited.ref} (${transaction.debited.type}),
                                \n- From ${transaction.credited.ref} (${transaction.credited.type}),
                                \n\t after an aborted subscription submission.`

                    return AccountsManager.transact(session,{from:transaction.credited.ref,to:transaction.debited.ref,amount:transaction.amount,reason:reason});
                })
                .then((txnID)=>{
                    /// Apply changes and set cancellation transaction id in the doc
                    doc.state=enums.subscriptions.ABORTED;
                    doc.cancelDate=Date.now();
                    doc.cancelTxnRef=txnID;

                    return subs.modify("_id=:id")
                    .bind("id",subscriptionRef)
                    .patch(doc)
                    .execute();
                })
                .then((rs)=>{
                    if(rs.getAffectedRowsCount()>0){
                        session.commit()
                        .then(()=>{
                            resolve(rs);
                        })
                    }else{
                        session.rollback();
                        reject();
                    }
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },
        
        setDone(session,subscriptionRef){
            return new Promise((resolve,reject)=>{
                let doc=null;
                let confirmTxn=null;
                let agencyAccount=null;
                let subs=session.getSchema(connection.database)
                .getCollection("subscriptions");
                subs
                .find("_id=:id")
                .bind("id",subscriptionRef)
                .execute((rw)=>{
                    doc=rw;
                })
                .then((rs)=>{
                    if(doc.state===enums.subscriptions.ONGOING){
                        /// Read the transaction that confirmed this submission.
                        return AccountsManager.readTransactionByRef(session,doc.confirmTxnRef)
                    }
                    reject();
                })
                .then((transaction)=>{
                    confirmTxn=transaction;
                    return AccountsManager.readAgencyAccountDetails(session,doc.agencyRef);
                })
                .then((account)=>{
                    agencyAccount=account;
                    session.startTransaction();
                    // Send withdrawn money to agency.
                    let reason= `Sending ${confirmTxn.amount} 
                                \n- To ${agencyAccount._id} (BUSINESS),
                                \n- From ${confirmTxn.credited.ref} (${confirmTxn.credited.type}),
                                \n\t after a successful subscription submission.`
                    return AccountsManager.transact(session,{from:confirmTxn.credited.ref,to:agencyAccount._id,amount:confirmTxn.amount,reason:reason});
                })
                .then((txnID)=>{
                    /// Apply changes and set cancellation transaction id in the doc
                    doc.state=enums.subscriptions.DONE;
                    doc.doneDate=Date.now();
                    doc.doneTxnRef=txnID;

                    return subs.modify("_id=:id")
                    .bind("id",subscriptionRef)
                    .patch(doc)
                    .execute();
                })
                .then((rs)=>{
                    if(rs.getAffectedRowsCount()>0){
                        session.commit()
                        .then(()=>{
                            resolve(rs);
                        })
                    }else{
                        session.rollback();
                        reject();
                    }
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },
    }
}

module.exports=SubscriptionBuilder;