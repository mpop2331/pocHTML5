const cds = require("@sap/cds");

module.exports = cds.service.impl(async function (service) {
    const db = await cds.connect.to("db");
    const {Products, Classifications, User} = this.entities;
    
    this.on("POST", Classifications ,async (req) => {
        const {Product_GUID} = req.data;
        let classificationRes = await db.read(Classifications).where({Product_GUID:Product_GUID,Status:3});
        
        console.log("______________________");
        console.log(classificationRes);
        console.log("______________________");

        if(classificationRes.length === 0){ //don`t have entires so not checking required

            await db.post(Classifications).entries(req.data);
            return req.data;
        }

        const tx = cds.transaction(req)
        await tx.run ([
            UPDATE (Classifications) .set({Status: -1}) .where({GUID:classificationRes[0].GUID}),
            INSERT.into (Classifications) .entries (req.data)
        ]);
        
        return req.data
    });

    this.on("getCurrentUser",async(req)=>{
        
        const sUser = req.user.id;
        let aUserres = await db.read(User).where({User:sUser});

        console.log("____________________RES");
        console.log(sUser);
        console.log("____________________RES");

        console.log("____________________RES");
        console.log(aUserres);
        console.log("____________________RES");

        if(aUserres.length === 0){ // doesn`t exixts
            return {
                Client: ""
            }
        }

        return {
            Client: aUserres[0].Client
        }
    })
});
