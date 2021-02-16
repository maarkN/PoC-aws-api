("use strict");
const connection = require("./db_connect");
const AWS = require('aws-sdk');
const AmazonCognitoIdenty = require('amazon-cognito-identity-js');
global.fetch = require('node-fetch')


const UserPoolId = "us-east-1_OMQMoL5ak"
const ClientId = "54v0fu6g3bdjrrmn49rum3h9i1"

const poolData = {
  UserPoolId,
  ClientId
}

AWS.config.update({
  region: 'us-east-1'
})

async function registerUserAWS(json) {
  const {
    telephoneNumber,
    confirmationCode,
    password
  } = json
  
  return new Promise((resolve, reject) => {
    let attibuteList = []

    attibuteList.push(new AmazonCognitoIdenty.CognitoUserAttribute({
      Name:"phone_number",
      Value: telephoneNumber
    }));

    // attibuteList.push(new AmazonCognitoIdenty.CognitoUserAttribute({
    //   Name:"custom:confirmationCode",
    //   Value: confirmationCode
    // }))

    const userPool = new AmazonCognitoIdenty.CognitoUserPool(poolData)

    userPool.signUp(telephoneNumber, password, attibuteList, null, function(err, result){
      if(err) {
        return resolve({
          statusCode: 500,
          err
        })
      }

      resolve({
        statusCode: 200,
        confirmationCode,
        message: 'User sucessfully registered'
      })
    })
  })
}

module.exports.saveUserOnDatabase = async (event, context, callback) => {
  console.log('SAVE', event)
  callback(null, {
    statusCode: 200,
    body: 'POST SignUp Sucesssssssssss!'
  })
}


module.exports.registerUser = async (event, context, callback) => {
  // send the response right away when the callback runs, instead of waiting for the Node.js event loop to be empty
  // for more info: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
  console.log('Body', event.body)
  context.callbackWaitsForEmptyEventLoop = false;

  const json = JSON.parse(event.body)
  console.log('CHEGOU AQUI !!!')
  const result = await registerUserAWS(json)

  callback(null, {
    statusCode: result.statusCode,
    body: JSON.stringify(result)
  })
};


module.exports.getUsers = async (event, context, callback) => {
  // send the response right away when the callback runs, instead of waiting for the Node.js event loop to be empty
  // for more info: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
  context.callbackWaitsForEmptyEventLoop = false;

  const getUsersPromise = new Promise((resolve, reject) => {
    connection.query("SELECT * FROM users", function (err, results) {
      if (err) {
        reject({ error: err });
      } else {
        resolve(results);
      }
    });
  });

  const result = await getUsersPromise;

  callback(null, {
    statusCode: result.error ? result.error.statusCode || 500 : 200,
    body: result.error
      ? "Error: Could not find Todos: " + result.error
      : JSON.stringify(result),
  });
};

module.exports.createUser = async (event, context, callback) => {
  // send the response right away when the callback runs, instead of waiting for the Node.js event loop to be empty
  // for more info: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
  context.callbackWaitsForEmptyEventLoop = false;
  const qs = require("querystring");
  const data = qs.parse(event.body);

  if (
    !event.multiValueHeaders["Content-Type"].includes(
      "application/x-www-form-urlencoded"
    )
  ) {
    callback(null, {
      statusCode: 400,
      body:
        "Error: Content-Type is different of accepted ['application/x-www-form-urlencoded']",
    });
  }

  const createUserPromise = new Promise((resolve, reject) => {
    const sql = "INSERT INTO users (name, email) VALUES (?,?)";
    const values = [data.name, data.email];
    connection.query(sql, values, function (err, results) {
      if (err) {
        reject({ error: err });
      } else {
        resolve(results);
      }
    });
  });

  const result = await createUserPromise;

  callback(null, {
    statusCode: result.error ? result.error.statusCode || 500 : 200,
    body: result.error
      ? "Error: Could not create User: " + result.error
      : JSON.stringify({
          message: "User created successfully!",
          userId: result.insertId,
          name: data.name,
          email: data.email,
        }),
  });
};

module.exports.updateUser = async (event, context, callback) => {
  // send the response right away when the callback runs, instead of waiting for the Node.js event loop to be empty
  // for more info: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
  context.callbackWaitsForEmptyEventLoop = false;
  const qs = require("querystring");
  const data = qs.parse(event.body);

  if (
    !event.multiValueHeaders["Content-Type"].includes(
      "application/x-www-form-urlencoded"
    )
  ) {
    callback(null, {
      statusCode: 400,
      body:
        "Error: Content-Type is different of accepted ['application/x-www-form-urlencoded']",
    });
  }

  const updateUserPromise = new Promise((resolve, reject) => {
    const sql = "UPDATE users SET name=?, email=? WHERE userId=?";
    const values = [data.name, data.email, event.pathParameters.id];
    connection.query(sql, values, function (err, results) {
      if (err) {
        reject({ error: err });
      } else {
        resolve(results);
      }
    });
  });

  
  const result = await updateUserPromise;
  
  callback(null, {
    statusCode: result.error ? result.error.statusCode || 500 : 200,
    body: result.error
      ? "Error: Could not update User: " + result.error
      : JSON.stringify({
          message: "User updated successfully!",
        }),
  });
};

module.exports.deleteUser = async (event, context, callback) => {
  // send the response right away when the callback runs, instead of waiting for the Node.js event loop to be empty
  // for more info: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
  context.callbackWaitsForEmptyEventLoop = false;
  const qs = require("querystring");

  if (
    !event.multiValueHeaders["Content-Type"].includes(
      "application/x-www-form-urlencoded"
    )
  ) {
    callback(null, {
      statusCode: 400,
      body:
        "Error: Content-Type is different of accepted ['application/x-www-form-urlencoded']",
    });
  }
  
  const haveUserPromise = new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE userId=?";
    const values = [event.pathParameters.id];
    connection.query(sql, values, function (err, results) {
      if (err) {
        reject({ error: err });
      } else {
        resolve(results);
      }
    });
  });

  const deleteUserPromise = new Promise((resolve, reject) => {
    const sql = "DELETE FROM users WHERE userId=?";
    const values = [event.pathParameters.id];
    connection.query(sql, values, function (err, results) {
      if (err) {
        reject({ error: err });
      } else {
        resolve(results);
      }
    });
  });

  
  var result = await haveUserPromise.then(async result => {
    if (result.length) {
      return await deleteUserPromise;
    } else {
      return { userId: event.pathParameters.id }
    }
  })
  
  callback(null, {
    statusCode: result.error ? result.error.statusCode || 500 : 200,
    body: result.error
      ? "Error: Could not delete User: " + result.error
      : JSON.stringify({
          message: result.userId ? "Could found user with id: " + result.userId : "User deleted successfully!",
        }),
  });
};

