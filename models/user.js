const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    profileImage: {
        filename: {
            type: String,
            default: "profileImage"
        },
        url: {
            type: String,
            default: "https://cdn-icons-png.flaticon.com/512/147/147144.png"
        }
    },
   
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
