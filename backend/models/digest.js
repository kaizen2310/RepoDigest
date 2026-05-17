import mongoose, { mongo, Schema } from "mongoose";

const digestSchema = new mongoose.Schema(
    {
        owner : {
            type : String,
            required : true
        },
        repo :{
            type : String,
            required : true
        },
        ref :{
            type : String,
            required : true
        },
        filesHash :{
            type : String
        },
        digest :{
            type : String,
            required : true
        },
        tokenCount :{
            type : Number
        },
        fileCount :{
            type :Number
        },
        meta :{
            description : String,
            stars : Number,
            language : String,
            license : String
        }
    },
    {
        timestamps : true
    }
)

digestSchema.index({owner : 1 , repo :1 , ref :1, filesHash :1})

export default mongoose.model('Digest', digestSchema)
