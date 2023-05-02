const { generateToken } = require("../config/jwtToken");
const jwt = require("jsonwebtoken")
const { generateRefreshToken } = require("../config/refreshToken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const sendEmail = require("./emailctrl");
const createUser = asyncHandler(async (req, res) => {
  const email = await req.body.email;
  const findUser = await User.findOne({ email: email });
  if (findUser) {
    throw new Error("User already exists");
  } else {
    const newUser = await User.create(req.body);
    res.json(newUser);
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = await req.body;
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser._id)
    const updateUser = await User.findByIdAndUpdate(
      findUser._id,{
        refreshToken:refreshToken
      },
      {
        new:true
      }
    )
    res.cookie("refreshToken",refreshToken,{
      httpOnly:true,
      maxAge:72*60*60*1000
    })
    res.json({
      token: generateToken(findUser._id),
      firstName: findUser.firstName,
      lastName: findUser.lastName,
      mobile: findUser.mobile,
      email: findUser.email,
      _id: findUser._id,
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const updateUser = await User.findByIdAndUpdate(
      _id,
      {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        mobile: req.body.mobile,
        email: req.body.email,
      },
      {
        new: true,
      }
    );
    res.json(updateUser);
  } catch (error) {
    throw new Error(error);
  }
});

const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies
    if(!cookie?.refreshToken){
      throw new Error("No Refresh Token found")
    }
    const refreshToken = await cookie.refreshToken
    console.log("re",refreshToken);
    const user = await User.findOne({refreshToken})
    jwt.verify(refreshToken,process.env.JWT_SECRET, (err,decoded)=>{
      console.log(decoded);
      if(err||user.id!==decoded.id){
        throw new Error("There is something error with refresh token")
      }
      const accessToken = generateToken(user.id)
      res.json(accessToken)
    })
  } 
)

const updatePassword = asyncHandler(async (req, res) => {
  const {_id} = req.user
  const {password} = req.body
  const user = await User.findById(_id)
  if(password){
    user.password = password
    const updatePassword = await user.save()
    res.json(updatePassword)
  }
  else{
    res.json(user)
  }
})

const forgotPasswordToken = asyncHandler(async(req,res)=>{
  const {email} = req.body
  const user = await User.findOne({email})
  if(!user) throw new Error('User with this email doesnot exist')
  try{
    const token = await user.createPasswordResetToken()
    await user.save()
    const resetUrl = `Hi,Please follow the link to reset your password.This Link is valid for 10minutes from now.<a href="http://localhost:3001/api/user/reset-password/${token}">Click here</a>`
    const data = {
      to:email,
      text:"Hey User",
      subject:"Forgot Password Link",
      html:resetUrl
    }
    sendEmail(data)
    res.json(token)
  }
  catch(error){
    throw new Error(error)
  }
})

const resetPassword = asyncHandler(async(req,res)=>{
  const {password} = req.body
  const {token} = req.params
  const hashedToken = crypto.createHash('sha256').update(token).digest("hex")
  const user = await User.findOne({
    passwordResetToken:hashedToken,
    passwordResetExpires:{$gt:Date.now()}
  })
  if(!user) throw new Error("Token Expired.Please try again later.")
  user.password = password
  user.passwordResetToken = null
  user.passwordResetExpires = null
  await user.save()
  res.json(user)
})

const logout = asyncHandler(async (req, res) => {
  const cookies = req.cookies
  if(!cookies?.refreshToken){
    throw new Error("No Refresh Token found")
  }
  const refreshToken = cookies.refreshToken
  const user = await User.findOne({refreshToken})
  if(!user){
    res.clearCookie("refreshToken",{
      httpOnly:true,
      secure:true
    })
    return res.sendStatus(204)
  }
  await User.findByIdAndUpdate(
refreshToken,{
  refreshToken:""
});
res.clearCookie("refreshToken",{
  httpOnly:true,
  secure:true
})
return res.sendStatus(204)

})

const getAllUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find();
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

const getSingleUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const getUser = await User.findById(id);
    res.json(getUser);
  } catch (error) {
    throw new Error(error);
  }
});
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const deleteUser = await User.findByIdAndDelete(id);
    res.json(deleteUser);
  } catch (error) {
    throw new Error(error);
  }
});
const blockUser = asyncHandler(async (req, res) => {
  try {
    const {id} = req.params
    const blockedUser = await User.findByIdAndUpdate(id,{
        isBlocked:true
    },{
        new:true
    })
    res.json(blockedUser)
  } catch (error) {}
});
const unblockUser = asyncHandler(async (req, res) => {
    try {
        const {id} = req.params
        const unBlockedUser = await User.findByIdAndUpdate(id,{
            isBlocked:false
        },{
            new:true
        })
        res.json(unBlockedUser)
    } catch (error) {}
  });
module.exports = {
  createUser,
  loginUser,
  getAllUser,
  getSingleUser,
  deleteUser,
  updateUser,
  blockUser,
  handleRefreshToken,
  unblockUser,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  logout
};
