const connection = require('./connection').config;
const accountManager = require('./comptesManager')();
const couponState = require('../lib/constants').couponState;
const gen = require('../lib/az09_string_gen');

function CouponManagerBuilder(){
    return {
        create(session,{accountRef,amount}){
            return new Promise((resolve,reject)=>{
                let account;
                let owner;
                let coupon;
                let couponCode;
                let schema= session.getSchema(connection.database);
                let coupons= schema.getCollection("coupons");

                session.startTransaction();
                accountManager.readAccountWithOwner(session,accountRef)
                .then((withName)=>{
console.log(withName);
                    account=withName.account;
                    owner= withName.owner;
                    return accountManager.bufferAmount(session,accountRef,amount,`Coupon ${amount} ${withName.account.currency}`)
                })
                .then((txnID)=>{
                    let coupon = {
                        state:couponState.ACTIVE,
                        code:gen(9),
                        amount:amount,
                        currency:account.currency,
                        emitter:{
                            name:owner.name,
                            type:owner.type,
                            account:account._id
                        },
                        emissionDate:Date.now(),
                        emissionTxn:txnID
                    }
                    return coupons.add(coupon).execute();
                })
                .then((rs)=>{
                    let ids= rs.getGeneratedIds();
                    if(ids && ids[0]){
                        coupon=ids[0];
                        return this.createPinForCoupon(session,coupon);
                    }
                })
                .then((pin)=>{
                    couponCode=pin;
                    session.commit();
                    resolve({coupon:coupon,pin:couponCode});
                })
                .catch((err)=>{
                    session.rollback();
                    reject(err);
                })
            })
        },

        getPinOfCoupon(session,couponRef){
            return new Promise((resolve,reject)=>{
                let code;
                let schema= session.getSchema(connection.database);
                let pinCodes= schema.getCollection("couponPinCode");
                pinCodes.find("coupon=:coupon")
                .bind("coupon",couponRef)
                .execute((_)=>{
                    code=_;
                })
                .then((rs)=>{
                    resolve(code);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        createPinForCoupon(session,couponRef){
            return new Promise((resolve,reject)=>{
                let pin = gen(6);
                let schema= session.getSchema(connection.database);
                let pinCodes= schema.getCollection("couponPinCode");
                pinCodes.add({
                    "coupon":couponRef,
                    "pin":pin
                })
                .execute()
                .then((rs)=>{
                    resolve(pin);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        readCouponByRef(session,ref){
            return new Promise((resolve,reject)=>{
                let coupon;
                let schema= session.getSchema(connection.database);
                let coupons= schema.getCollection("coupons");
                pinCodes.find("_id=:coupon")
                .bind("coupon",ref)
                .execute((_)=>{
                    coupon=_;
                })
                .then((rs)=>{
                    resolve(coupon);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        readCouponByCode(session,ref){
            return new Promise((resolve,reject)=>{
                let coupon;
                let schema= session.getSchema(connection.database);
                let coupons= schema.getCollection("coupons");
                coupons.find("code=:coupon")
                .bind("coupon",ref)
                .execute((_)=>{
                    coupon=_;
                })
                .then((rs)=>{
                    resolve(coupon);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },


        cashCoupon(session,{code='',pin='',destinationAccountRef=''}){
            return new Promise((resolve,reject)=>{
                let coupon;
                let pinEntry;
                let destination;

                let schema= session.getSchema(connection.database);
                let coupons= schema.getCollection("coupons");
                let pins = schema.getCollection("couponPinCode");
                session.startTransaction();
                Promise.all([
                    coupons.find("code=:coupon")
                    .bind("coupon",ref)
                    .execute((_)=>{
                        coupon=_;
                    }),
                    pins.find("code=:coupon AND pin=:pin") /// Check Pin
                    .bind("coupon",code)
                    .bind("pin",pin)
                    .execute((_)=>{
                        pinEntry=_;
                    }),
                    accountManager.readAccountWithOwner(session,destinationAccountRef)
                    .then((rs)=>{
                        destination=rs;
                        return "";
                    })
                ])
                .then(([coupon_rs,pins_rs,dest_rs])=>{
                    if(pinEntry && coupon && coupon.state === couponState.ACTIVE && destination){
                        return;
                    }else{
                        throw Error("Unavailable coupon");
                    }
                })
                .then(()=>{
                    return accountManager.unBufferAmount(session,destination.account._id,coupon.amount,`Encaissement Coupon ${coupon.code}`);
                })
                .then((txnID)=>{
                    if(txnID){
                        coupon.state = couponState.CASHED,
                        coupon.receiver = {
                            account:destination._id,
                            type:destination.owner.type,
                            owner:destination.owner.name
                        }
                        coupon.receptionTxn=txnID;
                        coupon.receptionDate=Date.now();

                        return coupons.modify("_id=:id")
                        .bind("id",coupon._id)
                        .patch(coupon)
                        .execute();
                    }
                    else{
                        throw new Error("Transfer failed.");
                    }

                })
                .then((rs)=>{
                    if(rs.getAffectedItemsCount() > 0) {
                        session.commit();
                        resolve(coupon);
                    }else{
                        throw new Error("Affected Items not found");
                    }
                })
                .catch((err)=>{
                    session.rollback();
                    reject(err);
                })
            })
        },
        
        abortCoupon(session,couponRef=""){
            return new Promise((resolve,reject)=>{
                let coupon;
                let destination;
                let schema= session.getSchema(connection.database);
                let coupons= schema.getCollection("coupons");

                session.startTransaction();
                coupons.find("_id=:coupon")
                .bind("coupon",couponRef)
                .execute((_)=>{
                    coupon=_;
                })
                .then(()=>{
                    return accountManager.readAccountWithOwner(session,coupon.emitter.account)
                })
                .then((rs)=>{
                    destination=rs;
                    return "";
                })
                .then(()=>{
                    if(destination && coupon && coupon.state === couponState.ACTIVE && (!coupon.abortionDate) && (!coupon.receptionDate)){
                        return;
                    }else{
                        throw new Error("Unavailable coupon");
                    }
                })
                .then(()=>{
                    return accountManager.unBufferAmount(session,destination.account._id,coupon.amount,`Annulation Coupon ${coupon.code}`);
                })
                .then((txnID)=>{
                    if(txnID){
                        coupon.state = couponState.ABORTED,
                        coupon.abortionTxn=txnID;
                        coupon.abortionDate=Date.now();
                        return coupons.modify("_id=:id")
                        .bind("id",coupon._id)
                        .patch(coupon)
                        .execute();
                    }
                    else{
                        throw new Error("Transfer failed.");
                    }
                })
                .then((rs)=>{
                    if(rs.getAffectedItemsCount() > 0) {
                        session.commit();
                        resolve(coupon);
                    }else{
                        throw new Error("Affected Items not found");
                    }
                })
                .catch((err)=>{
                    session.rollback();
                    reject(err);
                })
            })
        },

        readCouponInitiatedFromAccount(session,accountRef){
            return new Promise((resolve,reject)=>{
                let coupon_list=[];
                let schema= session.getSchema(connection.database);
                let coupons= schema.getCollection("coupons");
                coupons.find("emitter.account=:ref")
                .bind("ref",accountRef)
                .execute((_)=>{
                    coupon_list.push[_];
                })
                .then(()=>{
                    resolve(coupon_list);
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        },

        readCouponReceivedByAccount(session,accountRef){
            return new Promise((resolve,reject)=>{
                let coupon_list=[];
                let schema= session.getSchema(connection.database);
                let coupons= schema.getCollection("coupons");
                coupons.find("receiver.account=:ref")
                .bind("ref",accountRef)
                .execute((_)=>{
                    coupon_list.push[_];
                })
                .then(()=>{
                    resolve(coupon_list);
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        },
    }
}

module.exports= CouponManagerBuilder;
