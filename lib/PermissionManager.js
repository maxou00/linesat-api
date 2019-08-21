const LVL_ONE=1;
const LVL_TWO=2;
const LVL_THREE=3;
const LVL_FOUR=4;
const LVL_FIVE=5;
const LVL_SIX=6;

const SystemPermissionManager={
    
    canReadAgencies(lvl){
        return lvl >= LVL_ONE;
    },
    
    canCreateAgency(lvl){
        return lvl >= LVL_THREE;
    },

    canCloseAgency(lvl){
        return lvl >= LVL_FOUR;
    },

    canReadBouquets(lvl){
        return lvl >= LVL_ONE;
    },
    
    canCreateBouquet(lvl){
        return lvl >= LVL_FOUR;
    },

    canDeleteBouquet(lvl){
        return lvl >= LVL_FOUR;
    },

    canLockBouquet(lvl){
        return lvl >= LVL_FOUR;
    },

    canUpdateBouquet(lvl){
        return lvl >= LVL_FOUR;
    },

    canReadCustomers(lvl){
        return lvl >= LVL_ONE;
    },

    canReadBusinessAccounts(lvl){
        return lvl >= LVL_ONE;
    },

    canCreditBusinessAccount(lvl){
        return lvl >= LVL_TWO;
    },

    canFreezeAccount(lvl){
        return lvl >= LVL_FOUR;
    },

    canReadTransactions(lvl){
        return lvl >= LVL_TWO;
    },

    canReadCustomerAccounts(lvl){
        return lvl >= LVL_ONE;
    },

    canReadUsers(lvl){
        return lvl >= LVL_FIVE;
    },

    canCreateUser(lvl){
        return lvl >= LVL_FIVE;
    },

    canGrantRoleToUser(lvl){
        return lvl >= LVL_FIVE;
    },

    canDenyRoleToUser(lvl){
        return lvl >= LVL_FIVE;
    },

    canDeleteUserAccount(lvl){
        return lvl >= LVL_FIVE;
    },
    
    isRootLevel(lvl){
        return lvl === LVL_SIX;
    }
}


const AgencyPermissionManager={
    canReadBouquets(lvl){
        return lvl >= LVL_ONE;
    },

    canReadAgencyProfile(lvl){
        return lvl >= LVL_THREE;
    },

    canUpdateAgencyProfile(lvl){
        return lvl >= LVL_THREE;
    },

    canReadAgencyAccount(lvl){
        return lvl >= LVL_TWO;
    },

    canReadCustomerAccounts(lvl){
        return lvl >=LVL_ONE;
    },

    canCreateCustomerAccount(lvl){
        return lvl >= LVL_ONE;
    },

    canCreditCustomerAccount(lvl){
        return lvl >= LVL_TWO;
    },

    canReadTransactions(lvl){
        return lvl >= LVL_TWO;
    },

    canCloseCustomerAccount(lvl){
        return lvl >= LVL_THREE;
    },

    canReadSubscriptions(lvl){
        return lvl >= LVL_ONE;
    },

    canAbortSubscriptions(lvl){
        return lvl >= LVL_TWO;
    },

    canConfirmSubscriptions(lvl){
        return lvl >= LVL_TWO;
    },

    canReadUsers(lvl){
        return lvl >= LVL_THREE;
    },

    canCreateUser(lvl){
        return this.isRootLevel(lvl);
    },

    canGrantRoleToUser(lvl){
        return this.isRootLevel(lvl);
    },

    canDenyRoleToUser(lvl){
        return this.isRootLevel(lvl);
    },

    canDeleteUserAccount(lvl){
        return this.isRootLevel(lvl);
    },

    canReadTransactions(lvl){
        return lvl >= LVL_TWO;
    },

    canInitiateTransaction(lvl){
        return lvl >= LVL_THREE;
    },
    
    isRootLevel(lvl){
        return lvl === LVL_FOUR;
    }
}



module.exports={
    system:SystemPermissionManager,
    agency:AgencyPermissionManager
}