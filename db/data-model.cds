namespace tc;

using {
    managed,
    cuid,
    sap,
    sap.common.CodeList as CodeList
} from '@sap/cds/common';

entity Product {
    key GUID                    : String(32);
        ID                      : String(60);
        Client                  : String(32);
        Description             : String(500);
        Language                : String(2) default 'EN';
        Status                  : Integer default 0;
        UploadedOn              : Timestamp;
        UploadedBy              : String(32);
        FileName                : String(100);
        DropOnReset             : hana.TINYINT;
        ClassRequest            : String(50) default '';
        ExpertClassificationReq : hana.TINYINT default '1';
        ScoringDate             : Timestamp;
        Completion              : Integer;

        to_Classification       : Composition of many Classification
                                      on to_Classification.Product = $self;
        to_Status               : Association to one Status
                                      on  to_Status.Object = 'Product'
                                      and to_Status.ID     = Status;
};

entity Classification {
    key GUID                  : UUID;
        Product               : Association to Product;
        Scheme                : String(32);
        CodeID                : String(32);
        Priority              : Integer;
        ConfidenceLevel       : hana.REAL;
        Type                  : String(10);
        DropOnReset           : hana.TINYINT;
        Status                : Integer default 0;
        CreatedBy             : String(32);
        CreatedOn             : Timestamp;
        AssignedOn            : Timestamp;
        AssignedTo            : String(32);
        ClassifiedBy          : String(32);
        ClassifiedOn          : Timestamp;
        ValidatedBy           : String(32);
        ValidatedOn           : Timestamp;
        ValidFrom             : Timestamp;
        ValidTill             : Timestamp;
        ManualClassification  : Integer default 0;
        FromClassificationReq : hana.TINYINT;
        SentToGTS             : hana.TINYINT;
        SentToML              : hana.TINYINT;
        ValidForML            : hana.TINYINT default 1;

        to_Status             : Association to one Status
                                    on  to_Status.Object = 'Classification'
                                    and to_Status.ID     = Status;
        to_Scheme             : Association to one Scheme;
};

entity Status {
    key ID     : Integer;
    key Object : String(32);
        Name   : String(32);
};


entity Scheme {
    key Scheme         : String(32);
        Name           : String(100);
        Version        : Integer;
        TopLevel       : String(32);
        BottomLevel    : String(32);
        CreatedBy      : String(32);
        CreatedOn      : Timestamp default CURRENT_TIMESTAMP;
        LastModifiedBy : String(32);
        LastModifiedOn : Timestamp default CURRENT_TIMESTAMP;
        ValidForECCN   : hana.TINYINT default 0;
};

entity Code {
    key ID        : String(32);
    key Scheme    : String(32);
        ValidFrom : Timestamp; //validity_begin
        ValidTill : Timestamp; //validity_end in the file
        Code      : String(32);
        ParentID  : String(32);
        Level     : String(8);
};

entity CodeDescription {
    key CodeID      : String(32);
    key Scheme      : String(32);
    key Language    : String(2);
        Description : String(5000);
};

entity ClientAttribute {
    key ProductGUID : String(32);
};

entity Attribute {
    key Name   : String(100);
        ML     : hana.TINYINT;
        Active : hana.TINYINT default 1;
};

entity User {
    key User         : String(64);
        FirstName    : String(64);
        LastName     : String(64);
        Email        : String(64);
        Client       : String(32);
        Role         : String(32);
        Language     : String(2);
        Status       : hana.TINYINT;
        ModifiedBy   : String(32);
        ModifiedDate : Timestamp;
};


entity Client {
    key Client                 : String(32);
    key ValidFrom              : Timestamp;
    key ValidTill              : Timestamp;
        Name                   : String(100);
        MemberFirm             : String(2) default 'BE';
        MemberFirmFactor       : Decimal(5, 3) default 1;
        ClassificationFactor   : Decimal(5, 3) default 1;
        SubscriptionFee        : Integer default 1000;
        SaaS                   : hana.TINYINT default 1;
        Demo_mode_active       : hana.TINYINT;
        Active                 : hana.TINYINT default 1;
        ValAutoClass           : hana.TINYINT default 1;
        StartDate              : Timestamp;
        EndDate                : Timestamp;
        TotalItems             : Integer default 0; // total of autoclassified items
        MultiSchemeWorklist    : hana.TINYINT default 0;
        AttributeFirst         : hana.TINYINT default 0;
        SubmodelFlag           : hana.TINYINT;
        DefaultLanguage        : String(2) default 'EN';
        Threshold              : Integer default 100;
        BusinessRuleEnabled    : hana.TINYINT default 0;
        VariantsEnabled        : hana.TINYINT default 0;
        UploadLimit            : Integer default 1000;
        EccnEnabled            : hana.TINYINT;
        MainScheme             : String(32);
        ECCNScheme             : String(32);
        ExcludedFromML         : String(100);
        RelevantAttributeName  : String(100);
        RelevantAttributeValue : String(100);
        NumberOfDays           : Integer default 5;
};

entity SchemeUser {
    key Scheme : String(32);
    key Client : String(32);
    key User   : String(32);
};


/// ____________________VIEW PART____________________
view Products as
    select from Product {
        key Product.GUID                    as GUID,
            Product.ID                      as ID,
            Product.Client                  as Client,
            Product.Description             as Description,
            Product.Language                as Language,
            Product.Status                  as Status,
            Product.UploadedOn              as UploadedOn,
            Product.UploadedBy              as UploadedBy,
            Product.FileName                as FileName,
            Product.DropOnReset             as DropOnReset,
            Product.ExpertClassificationReq as ExpertClassificationReq,
            UPPER(Product.ID)               as CIID          : String,
            UPPER(Product.Description)      as CIDescription : String,
            UPPER(Product.UploadedBy)       as CIUploadedBy  : String,
            UPPER(Product.FileName)         as CIFileName    : String
    }
    where (Product.Status = 1 or Product.Status = 4 );
