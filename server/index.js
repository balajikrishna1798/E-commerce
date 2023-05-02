const express = require("express")
const  dbConnect  = require("./config/dbConnect")
require("dotenv").config()
const authRouter = require("./routes/authRoutes")
const productRouter = require("./routes/productRoutes")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const { notFound, errorHandler } = require("./middleware/errorHandler")
const cors = require('cors')
const app = express()
const port = process.env.PORT || 4000
dbConnect()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(cors())
app.use(cookieParser())
app.use("/api/user",authRouter)
app.use("/api/product",productRouter)
app.use("/api/blog",productRouter)

app.use(notFound)
app.use(errorHandler)
app.listen(port,()=>{
    console.log(port);
})