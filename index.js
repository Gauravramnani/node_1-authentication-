import express from "express";
import path from "path";
import mongoose, { Schema } from "mongoose"
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();
const users = []

mongoose.connect("mongodb+srv://user123:user123@mongo.bmmrcqm.mongodb.net/?retryWrites=true&w=majority", {

    dbName: "backend"
}).then(console.log("connected sucessfully"));


const userSchema = new Schema({
    name: String,
    email: String,
    password: String
})

//first Argument is collection name, second is Schema
const User = mongoose.model("User", userSchema);



//Using MiddleWare
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())


//setting up view engine
app.set("view engine", "ejs");


const isAuthentication = async (req, res, next) => {

    const token = req.cookies.token;
    if (token) {
        const decoded = jwt.verify(token, "hfsadbfjhsabfkjsadb")

        req.user = await User.findById(decoded._id)
        next();
    }
    else {
        res.redirect("/login")
    }
}


app.get("/", isAuthentication, (req, res) => {


    res.render("logout", { name: req.user.name });

})


app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.redirect("/")

})

app.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
        return res.redirect("login");
    }


    const hashed_password = await bcrypt.hash(password, 10);


    user = await User.create({
        name,
        email,
        password: hashed_password
    })

    const token = jwt.sign({ _id: user._id }, "hfsadbfjhsabfkjsadb")



    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 10 * 1000)
    })

    res.redirect("/")

})

app.get("/login", (req, res) => {

    res.render("login")
})

app.get("/register", (req, res) => {

    res.render("register")
})

app.post("/login", async (req, res) => {

    const { email, password } = req.body;
    let user = await User.findOne({ email })
    if (!user) {

        return res.redirect("/register")
        console.log("wah")
    }

    const isMatch = await bcrypt.compare(password,user.password);

    if (!isMatch) {
        return res.render("login", { email, message: "incorrect password" })
    }

    const token = jwt.sign({ _id: user._id }, "hfsadbfjhsabfkjsadb")
    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 10 * 1000)
    })

    res.redirect("/")

})





app.post("/", async (req, res) => {


    users.push({ name: req.body.name, email: req.body.email });

    const { name, email } = req.body;


    await User.create({
        name,
        email
    })
    res.redirect("/success")
})



app.listen(5000, () => {

    console.log("thhe server run perfectly");
})