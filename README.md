# Poller

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/logo.png?alt=media&token=17e8705a-b234-43e0-85fb-ffc145d8335e)

Poller is MERN stack social media project to start your polls and also respond to some of others polls.

## For Demo, please visit:

https://poller-e5529.web.app

Poller uses following tech tack and tools :

### Frontend:

-   React
-   Redux
-   Redux Saga
-   React router

### Backend

-   Node.js
-   Express
-   Sendgrid - For emails
-   Mongoose - MongoDB ORM
-   Morgan - Reqeust logging
-   socket.io - Notificatons
-   Firebase - file storage
-   MongoDB - Database

### Deployment

-   Frontend - Firebase Hosting
-   Backend - Heroku
-   Database - MongoDB Atlas

## How to deploy the project.

-   Frontend
    Since it's just a react project, just follow below steps:
    1. Clone the [`poller-frontend`](https://github.com/deshmukhakash55/poller-frontend.git) project.
    2. Open terminal and navigate to the project folder
    3. Execute `npm i` to download dependencies
    4. Execute `npm run build` to generate prod build.
       or
    5. Execute `npm start` to start local server.
    6. Deploy the build from `dist\` folder on your server.

Note - Frontend will rest endpoints which has base url starting with `https://poller-backend.herokuapp.com`, so in case of your base url varies, make sure you update it in `endpoints.js` file

-   Database
    Get the MongoDB URI. Make sure the DB user has proper privileges. Create the Database `poller`

-   Backend
    Backend for poller is Node.js. So follow the below steps to execute it
    1. Clone the [`poller-backend`](https://github.com/deshmukhakash55/poller-backend.git) project.
    2. Open the terminal and navigate to the folder.
    3. Execute `npm i`.
    4. Create a folder named `configs.js` in project root which exports a object as default.
    5. Create a account on Sendgrid for mailing services and add your API key to the Object.
       ![image](<https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/carbon%20(6).png?alt=media&token=59ba2189-8b17-44cf-9d17-40c1d39008d2>)
    6. Also populate Object with MONGODB uri and other details.
    7. Create a account on firebase (if you don't have one) and then create a new project.
    8. Create a `keys` folder in project root.
    9. Get the admin key JSON and add it in `keys` folder.

And you are good to go!!!!

## Login Page

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/login.png?alt=media&token=07b83438-a642-4331-aa1c-d41c6360df1f)

## Register Page

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/register.png?alt=media&token=9a5396b2-5664-4039-a4f8-61a8301e32bc)

## Main Page

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/main.png?alt=media&token=cd0dd7b0-cf66-45a3-8cc3-872ec7ad3174)

## Search

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/search.png?alt=media&token=69a1946b-0950-41de-8727-212e591d20fc)

## Search

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/search.png?alt=media&token=69a1946b-0950-41de-8727-212e591d20fc)

## New Poll

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/newpoll.png?alt=media&token=0ac9f96e-dc7a-42c5-b797-705455134079)

## Notifications Page

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/notifications.png?alt=media&token=ca051d14-29fd-4a6a-9bd7-b97af00f5858)

## Followings Page

![image](https://firebasestorage.googleapis.com/v0/b/poller-e5529.appspot.com/o/profile.png?alt=media&token=68e90aee-60b7-4fab-8d02-fd6cd5a961aa)

And if you like the project, make sure you star the project so others can also learn.
