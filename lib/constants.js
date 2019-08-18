

const permissions={
    perm_lvl_one:1,
    perm_lvl_two:2,
    perm_lvl_three:3,
    perm_lvl_four:4
}

const UserType={
    SYSTEM:'SYSADMIN',
    AGENCY:'AGENCY',
    CUSTOMER:'CUSTOMER'
}

const SubState={
    WAITING:'waiting', // Subscription is submitted
    ONGOING:'ongoing', // the given agency is processing subscription
    DONE:'done', // subscription has been done
    ABORTED:'aborted' // subscription has been aborted
}

const BouquetState={
    ACTIVE:'active',
    LOCKED:'locked'
}

module.exports={
    permissions:permissions,
    UserType:UserType,
    subscriptions:SubState,
    bouquets:BouquetState
}