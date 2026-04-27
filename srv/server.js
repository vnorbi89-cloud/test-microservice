
const express = require("express");
const passport = require("passport");
const xsenv = require("@sap/xsenv");
const { JWTStrategy } = require("@sap/xssec").v3;
const { executeHttpRequest } = require("@sap-cloud-sdk/http-client");

xsenv.loadEnv();
const services = xsenv.getServices({
  uaa: { tag: "xsuaa" }
});
passport.use(new JWTStrategy(services.uaa));
const app = express();
app.use(express.json());
app.use(passport.initialize());


app.post(
  "/onTestMicro",
  passport.authenticate("JWT", { session: false }),
  async (req, res) => {
    try{
      console.log("----0--------0--------0-------0-----------0-------0--------0--------")
        const before = req.body.data?.beforeImage;
        const current = req.body.data?.currentImage;
        const data = req.body;
        const subject = current.subject;
        const caseuuid = current.id;
        const newSubject = `${subject} LOW`;
        
        const tokenResponse = await executeHttpRequest(
            { destinationName: "C4C_Case" },
            {
                method: "GET",
                url: "sap/c4c/api/v1/iam-service/token"
            },
            { timeout: 10000 }
        );
        const c4cToken = tokenResponse.data?.value?.access_token;
        if (!c4cToken ) {
            return res.status(500).json({ error: "Failed to retrieve access token." });
        }
        
        caseLastedited = current.adminData.updatedOn;
        if (!caseLastedited ) {
            return res.status(500).json({ error: "Failed to retrieve last edited date." });
        }

        console.log(JSON.stringify(current))

        const caseResponse = await executeHttpRequest(
            { destinationName: "C4C_Case" },
            {
              method: "PATCH",
              url: `/sap/c4c/api/v1/case-service/cases/${caseuuid}`,
              headers: {
                    Authorization: `Bearer ${c4cToken}`,
                    'If-Match': caseLastedited,
                    'Content-Type': 'application/merge-patch+json'
            },
              data: {
                subject: newSubject,
                priority: "03"
              }
            },
            {
              fetchCsrfToken: false,
              timeout: 10000
            }
        );

        res.status(200).send('OK');

    } catch (error){
        console.log(error);      
        res.status(500).send("Internal Server Error");
    }

})

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('myapp listening on port ' + port);
});