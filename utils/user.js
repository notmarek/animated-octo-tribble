import * as jose from 'jose'
import { connPromise } from './db.js';
export const verify_jwt = async (secret, token) => {
    let jwt_res;
    try {
        jwt_res = await jose.jwtVerify(token, secret, {
        issuer: 'Marek',
        audience: 'users',
      })
    } catch (e) {
      return false;
    }
    return jwt_res;
}

export const user_from_jwt = async (secret, token) => {
    let jwt_res = await verify_jwt(secret, token);
    if (!jwt_res)
        return [false, "Invalid token"];
    
    let client = await connPromise;
    let collection = client.db("app").collection("users");
    let found_user = await (await collection.find({_id: jwt_res.payload.user_id})).first();
    if (!found_user)
      return [false, "Valid token but no user found. deleted?"];
    return [true, found_user]
}