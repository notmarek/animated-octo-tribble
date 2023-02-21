import express from "express";
import { connPromise } from "../utils/db.js";
import { verify_jwt } from "../utils/user.js";
let router = express.Router();

router.post('/create', async (req, res, next) => {
    let jwt = req.headers.authorization;
    const secret = req.app.get("secret");
    let jwt_res = verify_jwt(secret, jwt);
    if (!jwt_res)
        return res.json({ok: false, msg: "Invalid token"});
    let client = await connPromise;
    let collection = client.db("app").collection("notes");
    await collection.insertOne({ user_id: jwt_res.payload.user_id, note: req.body.note, important: false });
    res.json({ok: true, msg: "Note created."});
});

router.get("/all", async (req, res, next) => {
    let jwt = req.headers.authorization;
    const secret = req.app.get("secret");
    let jwt_res = verify_jwt(secret, jwt);
    if (!jwt_res)
        return res.json({ok: false, msg: "Invalid token"});
    let client = await connPromise;
    let collection = client.db("app").collection("notes");
    let notes = await (await collection.find({ user_id: jwt_res.payload.user_id })).toArray();
    return res.json({ok: true, msg: "success", data: notes });
})

router.post("/star", async (req, res, next) => {
    let jwt = req.headers.authorization;
    const secret = req.app.get("secret");
    let jwt_res = verify_jwt(secret, jwt);
    if (!jwt_res)
        return res.json({ok: false, msg: "Invalid token"});
    let client = await connPromise;
    let collection = client.db("app").collection("notes");
    let is_starred = (await (await collection.find({ user_id: jwt_res.payload.user_id, _id: req.body.note_id })).first()).important;
    await collection.updateOne({ user_id: jwt_res.payload.user_id, _id: req.body.note_id }, {important: !is_starred});
    return res.json({ok: true, msg: "success" }); 
})



export default router;