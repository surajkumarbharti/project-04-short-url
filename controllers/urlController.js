const validUrl = require('valid-url')
const shortid = require('shortid')
const redis = require("redis");
const urlModel = require("../models/Urlmodel")
const { promisify } = require("util");  //use to convert callback based function to promise based function

//////////////// CONNECT TO REDIS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

const redisClient = redis.createClient(
  16853,
  "redis-16853.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("scGm8mJuIxI7gQn6gwYgf5eJux65P9Fv", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {  ///// .on use to connect radis
  console.log("Connected to Redis..");
});

//////// CONNECTION SETUP TO REDIS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);  // SAVE DATA IN CACHE

const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);  // FATCH DATA FROM CACHE


// /////////// START CREATE SHORT URL  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

const createShorturl = async function (req, res) {
  try {

    let { longUrl } = req.body

      // if body is empety 

    if (Object.keys(req.body).length == 0) { return res.status(400).send({ message: "please input data" }) }


    
    //***  check url validation *****//

    if (!validUrl.isUri(longUrl)) {
      return res.status(400).json('Invalid base URL')
    }

    //Finding long url in cache----

    let alreadyCreate = await GET_ASYNC(`${longUrl}`)   // $  TO check value()

    let jsonData = JSON.parse(alreadyCreate)

    if (alreadyCreate) {
      return res.status(201).send({ status: true, message: "succesfull", data: jsonData })
    }

    //create short url-------    


    else {
      const baseUrl= 'http://localhost:3000'
      //const baseUrl = 'http:localhost:3000'
      const urlCode = shortid.generate().toLowerCase()
      const shortUrl = baseUrl + '/' + urlCode
      const newUrl = { longUrl, shortUrl, urlCode }
      const short = await urlModel.create(newUrl)


      //save short url in casche----

      await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(short))


      return res.status(201).send({ status: true, data: short })
    }
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message })
  }

}
////////////////////////////////////////// POST COMPLETE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\




    /////////////////// START REDIRECT SHORT URL TO LONG URL  ****\\\\\\\\\\\\\\\\\\\\\\\\


const getlongurl = async function (req, res) {
  try {

    let urlCode = req.params.urlCode

    if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: "Please provide Correct urlCode." });

    
    // Find urlcode  in cache----

    let Url = await GET_ASYNC(`${urlCode}`)

    // console.log(Url)
    if (Url) {
      return res.status(302).redirect(Url)
    }

    //Find urlcode in Database----

    let url = await urlModel.findOne({ urlCode: urlCode })

    if (!url)

      return res.status(404).send({ status: false, message: "URL not found !" });

    //save urlcode in cache-----

    await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url.longUrl))

    //redirect to long url-----

    return res.status(302).redirect(url.longUrl)

  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message })
  }


}
/////////////////////////////////// GET API  DONE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

module.exports = { createShorturl, getlongurl } 

//////////////////////////// DESTRUCYURE \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\