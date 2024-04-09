const express = require("express");
const jwt = require("jsonwebtoken");
const zod = require("zod");
const userRouter = express.Router();
const { User, Account } = require("../db");
const JWT_SECRET = require("../config");
const { authMiddleware } = require("../middleware");

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

const signupSchema = zod.object({
  username: zod.string().email(),
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});
const signBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

userRouter.post("/signup", async (req, res) => {
  const body = req.body;
  const { success } = signupSchema.safeParse(req.body); // destructuring
  if (!success)
    return res.status(411).json({ message: "Email taken/wrong inouts" });

  const exsistingUser = await User.findOne({
    username: body.username,
  });
  if (exsistingUser) {
    return res.status(411).json({ messsage: "Email taken" });
  }

  const user = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });
  const userId = user._id;

  ///----- Create new Account--------///
  await Account.create({
    userId, // since property is same
    balance: 1 + Math.random() * 1000,
  });
  ///----- Create new Account--------///

  const token = jwt.sign({ userId }, JWT_SECRET);

  res.status(200).json({
    message: "User created successfully",
    token: token,
  });
});

// login route

userRouter.post("/signin", async (req, res) => {
  //1. verify using zod
  const { success } = signBody.safeParse(req.body);
  if (!success) {
    return res.status(400).send("Invalid email or password");
  }

  //2. check the user exists
  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (!user) {
    res.status(411).json({
      message: "Error while logging in",
    });
  }
  //3. create and send a token
  const token = jwt.sign({ userId: user._id }, JWT_SECRET);
  return res.status(200).json({ token });
});

//update a field
userRouter.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Error while updating information",
    });
  }
  // made in authmiddleware
  await User.updateOne({ _id: req.userId }, req.body);

  res.json({
    message: "Updated successfully",
  });
});

userRouter.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          // or `/${filter}/`
          $regex: filter,
        }, //?filter=har ... should be able to return harshit
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = userRouter;
