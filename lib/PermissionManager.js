const LVL_ONE=1;
const LVL_TWO=2;
const LVL_THREE=3;
const LVL_FOUR=4;
const LVL_FIVE=5;
const LVL_SIX=6;

module.exports = {
    
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