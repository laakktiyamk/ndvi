var mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

var userSchema = new mongoose.Schema({
  
  date: {
    type:String,
  },
  companyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  geometry: {
    type: [Object],
    unique: true,    
  },
  currentWorkarea: {
    type: Number,
    default: 0,
  },
  workareaCount: {
    type: Number,
    default: 0,
  },
  ready: {
    type: Boolean,
    default: false,
  },
});

userSchema.plugin(uniqueValidator);
module.exports = new mongoose.model("User", userSchema);
