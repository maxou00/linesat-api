const LVL_ONE=1;
const LVL_TWO=2;
const LVL_THREE=3;
const LVL_FOUR=4;
const LVL_FIVE=5;
const LVL_SIX=6;

module.exports = class PermissionManager{
    
    static canReadAgencies(lvl){
        return lvl >= LVL_ONE;
    }
    
    static canCreateAgency(lvl){
        return lvl >= LVL_THREE;
    }

    static canCloseAgency(lvl){
        return lvl >= LVL_FOUR;
    }

    static canReadBouquets(lvl){
        return lvl >= LVL_ONE;
    }
    
    static canCreateBouquet(lvl){
        return lvl >= LVL_FOUR;
    }

    static canDeleteBouquet(lvl){
        return lvl >= LVL_FOUR;
    }

    static canLockBouquet(lvl){
        return lvl >= LVL_FOUR;
    }

    static canUpdateBouquet(lvl){
        return lvl >= LVL_FOUR;
    }

    static canReadCustomers(lvl){
        return lvl >= LVL_ONE;
    }

    static canReadBusinessAccounts(lvl){
        return lvl >= LVL_ONE;
    }

    static canCreditBusinessAccount(lvl){
        return lvl >= LVL_TWO;
    }

    static canFreezeAccount(lvl){
        return lvl >= LVL_FOUR;
    }

    static canReadTransactions(lvl){
        return lvl >= LVL_TWO;
    }

    static canReadCustomerAccounts(lvl){
        return lvl >= LVL_ONE;
    }

    static canReadUsers(lvl){
        return lvl >= LVL_FIVE;
    }

    static canCreateUser(lvl){
        return lvl >= LVL_FIVE;
    }

    static canGrantRoleToUser(lvl){
        return lvl >= LVL_FIVE;
    }

    static canDenyRoleToUser(lvl){
        return lvl >= LVL_FIVE;
    }

    static canDeleteUserAccount(lvl){
        return lvl >= LVL_FIVE;
    }


    static isRootLevel(lvl){
        return lvl === LVL_SIX;
    }
}