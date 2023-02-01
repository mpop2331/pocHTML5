using {tc as my} from '../db/data-model';

service CatalogService @(path : '/catalog') @(requires : 'authenticated-user') {
  entity Products @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.Products
  /*
    select from my.Product {
      Product.GUID                    as GUID,
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
      UPPER(Product.ID)               as CIID:String,
      UPPER(Product.Description)      as CIDescription:String,
      UPPER(Product.UploadedBy)       as CIUploadedBy:String,
      UPPER(Product.FileName)         as CIFileName:String
    } where (Product.Status = 1 OR Product.Status = 4);
    */

  entity Classification @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.Classification;

  entity Scheme @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.Scheme;

  entity Code @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.Code;

  entity CodeDescription @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.CodeDescription;

  entity ClientAttribute @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.ClientAttribute;

  entity Attribute @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.Attribute;

  entity User @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.User;

  entity SchemeUser @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.SchemeUser;

  entity Status @(restrict : [
    {
      grant : ['READ'],
      to    : ['Viewer']
    },
    {
      grant : ['*'],
      to    : ['Admin']
    }
  ]) as projection on my.Status;

  function getCurrentUser() returns {
    Client : String;
  }

};
