const mongoose = require('mongoose')

// instantiate a mongoose schema

const URLSchema = new mongoose.Schema({
    urlCode: {type:String,requried:true,unique:true,lowercase:true,trim:true},
    longUrl: {type:String,required:true,trim:true},
    shortUrl: {type:String,trim:true,unique:true}
    
},{timestamps:true})

// create a model from schema and export it

module.exports = mongoose.model('Url', URLSchema)



