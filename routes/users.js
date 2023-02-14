import express from "express";
import { connPromise } from "../utils/db.js";
import argon2 from "argon2";
let router = express.Router();

/* GET users listing. */
router.post('/register', async (req, res, next) => {
  let client = await connPromise;
  let collection = client.db("app").collection("users");
  console.log({username: req.body.username, password: await argon2.hash(req.body.password), email: req.body.email});
  if (await (await collection.find({username: req.body.username})).first())
    return res.json({ok: false, msg: "This username is already taken."});
  if (await (await collection.find({email: req.body.email})).first())
    return res.json({ok: false, msg: "This email is already taken."})
  
  await collection.insertOne({username: req.body.username, password: await argon2.hash(req.body.password), email: req.body.email});
  res.json({ok: true, msg: "Account created."});
});

export default router