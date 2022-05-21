const express = require('express');

const router = express.Router();
const {createShorturl,getlongurl}=require("../controllers/urlcontroller")

router.post("/url/shorten",createShorturl)

router.get("/:urlCode",getlongurl)



module.exports = router;

//***************************************