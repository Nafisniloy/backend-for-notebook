// const { Router } = require('express');
// const { json } = require('express');
const express = require("express");
const { default: mongoose } = require("mongoose");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bycript = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");
const JWT_SECRET = "@notebooksecrettoken$";

// Route:1 create a user using post "/api/auth/createuser"/ No login required

router.post(
  "/createuser",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be longer then 5 characters").isLength({
      min: 5,
    }),
    body("name", "Please enter a valid name").isLength({ min: 3 }),
  ],
  async (req, res) => {
    //if there are errors return bad request and the errors
    const errors = validationResult(req);
    let success= false;
    if (!errors.isEmpty()) {
      return res.status(400).json({success, errors: errors.array() });
    }
    //check if a user with this email already exist
    try {
      let user = await User.findOne({ email: req.body.email });

      if (user) {
        return res
          .status(400)
          .json({success, error: "Sorry! A user with this email id already exists" });
      } else {
        // create new user
        const salt = await bycript.genSalt(10);
        secPass = await bycript.hash(req.body.password, salt);
        user = await User.create({
          name: req.body.name,
          email: req.body.email,
          password: secPass,
        });
        success=true;
        const data = {
          user: {
            id: user.id,
          },
        };
        const authtoken = jwt.sign(data, JWT_SECRET);
        res.json({authtoken,success,
          message:
            `Congrats ${req.body.name}! Account created successfully.`,
        });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send(success,"Something went wrong");
    }
  }
);
// Route:2 authenticating a user using post "/api/auth/login"/ No login required
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
    // body("password","Password must be longer then 5 characters").isLength({ min: 5 }),
  ],
  async (req, res) => {
    //if there are errors return bad request and the errors
    const errors = validationResult(req);
    let success= false;
    if (!errors.isEmpty()) {
      return res.status(400).json({success,errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      let user = await User.findOne({ email });
      if (!user) {
        res
          .status(400)
          .json({success, error: "Please try to login with correct creditionals" });
      } else {
        const passwordCompare = await bycript.compare(password, user.password);
        if (!passwordCompare) {
          res
            .status(400)
            .json({success, error: "Please try to login with correct creditionals" });
        } else {
          const data = {
            user: {
              id: user.id,
            },
          };
          const authtoken = jwt.sign(data, JWT_SECRET);
          success= true;
          res.json({success, authtoken });
        }
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send(success,"Internal server error : Something went wrong");
    }
  }
);

//Route3: Get logged in users details "/api/auth/getuser"/  login required
router.post("/getuser", fetchuser, async (req, res) => {
  try {
   let userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error : Something went wrong");
  }
});
module.exports = router;
