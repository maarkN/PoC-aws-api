const connection = require("./db_connect");

("use strict");

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
