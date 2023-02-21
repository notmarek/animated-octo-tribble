import express from "express";
import { connPromise } from "../utils/db.js";
import argon2 from "argon2";
import * as jose from 'jose'
import { user_from_jwt } from "../utils/user.js";
let router = express.Router();

router.post('/register', async (req, res, next) => {
  let client = await connPromise;
  let collection = client.db("app").collection("users");
  if (await (await collection.find({username: req.body.username})).first())
    return res.json({ok: false, msg: "This username is already taken."});
  if (await (await collection.find({email: req.body.email})).first())
    return res.json({ok: false, msg: "This email is already taken."})
  
  await collection.insertOne({username: req.body.username, password: await argon2.hash(req.body.password), email: req.body.email});
  res.json({ok: true, msg: "Account created."});
});

router.post("/login", async (req, res, next) => {
  let client = await connPromise;
  let collection = client.db("app").collection("users");
  let found_user = await (await collection.find({username: req.body.username})).first();
  
  if (!found_user)
    return res.json({ok: false, msg: "This username doesn't seem to exist."});
  
  if (!(await argon2.verify(found_user.password, req.body.password)))
    return res.json({ok: false, msg: "Wrong password."});

  const secret = req.app.get("secret");
  const alg = 'HS256'
  
  const jwt = await new jose.SignJWT({ 'user_id': found_user._id })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer("Marek")
    .setAudience("users")
    .setExpirationTime('2h')
    .sign(secret);

  return res.json({ok: true, msg: "Logged in.", token: jwt});
});

router.get("/me", async (req, res, next) => {
  let jwt = req.headers.authorization;
  const secret = req.app.get("secret");
  let [ok, data] = await user_from_jwt(secret, jwt);
  console.log(ok, data)
  if (!ok) 
    return res.json({ ok: false, msg: data })
  return res.json({ ok: true, msg: "User found", user: data })
})

export default router