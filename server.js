/**
 * Created by Maxwell on 2/14/2015.
 */

var express = require("express");
var http = require("http");
var app = express();
var server = http.createServer(app);
var io = require("socket.io")(server);
var bodyParser = require("body-parser");
var classes = require("./server/js/classes.js");
var port = process.env.PORT || 80;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use("/js", express.static(__dirname + "/client/js"));
app.use("/css", express.static(__dirname + "/client/css"));
app.use("/fonts", express.static(__dirname + "/client/fonts"));
app.use("/views/about", express.static(__dirname + "/client/views/about/index.html"));
app.get("/", function (request, response)
{
    response.sendFile(__dirname + "/client/views/index.html");
});
app.get(/^(.+)$/, function(req, res)
{
    console.log("static file request : " + req.params[0]);
    res.sendFile( __dirname + req.params[0]);
});
server.listen(port, function()
{
   console.log("Listening on port " + port);
});

/*Socket connection functions*/
io.on("connection", function(socket)
{
    socket.on("register", function(data)
    {
        var id = data.id;
        var name = data.name;
        var password = data.password;
        var nameExists = false;
        if(id == socket.id)
        {
            for(var i = 0; i < players.length; i +=1)
            {
                if(players[i].name == name)
                {
                    nameExists = true;
                }
            }
            if(!nameExists)
            {
                var player = new classes.Player(id, name, password);
                players.push(player);
                socket.emit("register-success", {player: player});
            }
            else
            {
                socket.emit("register-fail", {message: "That name is taken, please try another."});
            }
        }
        else
        {
            console.log("ERROR: Socket ID: " + socket.id + " != User ID: " + id);
            socket.emit("register-fail", {message: "An error occurred on the server."});
        }
    });
    socket.on("login", function(data)
    {
        var id = data.id;
        var name = data.name;
        var password = data.password;
        var nameExists = false;
        var servPlayer;
        if(id == socket.id)
        {
            for(var i = 0; i < players.length; i +=1)
            {
                if(players[i].name == name)
                {
                    nameExists = true;
                    servPlayer = players[i];
                    players[i].id = data.id;
                }
            }
            if(nameExists)
            {
                if(password == servPlayer.password)
                {
                    socket.emit("login-success", {player: servPlayer});

                }
                else
                {
                    socket.emit("login-fail", {message: "Incorrect Password"});
                }
            }
            else
            {
                socket.emit("login-fail", {message: "That name does not exist. Please register first."});
            }
        }
        else
        {
            socket.emit("register-fail", {message: "An error occurred on the server."});
        }
    });
    socket.on("gameInput", function(data)
    {
        if(canDoInput)
        {
            var name = data.name;
            var input = data.input;
            var hasDoneInput = false;
            for (var i = 0; i < gameInput.length; i +=1)
            {
                if(gameInput[i].name == name)
                {
                    //gameInput[i].input = input;
                    hasDoneInput = true;
                }
            }
            if(!hasDoneInput)
            {
                gameInput.push(data);
                for(var i = 0; i < players.length; i +=1)
                {
                    if(name == players[i].name)
                    {
                        players[i].numGames += 1;
                    }
                }
            }
            else
            {
                for(var i = 0; i < gameInput.length; i += 1)
                {
                    if(gameInput[i].name == name)
                    {
                        gameInput[i].input = input;
                    }
                }
            }
            console.log(gameInput);
        }
        else
        {
            socket.emit("cannot-input", {message: "You cannot do input now."});
        }
    });
    socket.on("get-player", function(data)
    {
        for(var i = 0; i < players.length; i += 1)
        {
            if(players[i].id == data.id)
            {
                socket.emit("out-player", {player: players[i]});
            }
        }
    });
});
/************************/
/*Game Related Variables*/
/************************/
/*The last second count at which the user was informed of the game state*/
var lastEmitTime;
/*A boolean dictating when a player may or may not give input*/
var canDoInput;
/*The game, consisting of an adjective and 3 nouns*/
var game = new classes.Game();
/*The list of all players*/
var players = [];
/*The list of players who gave input for the current game as well as their input*/
var gameInput = [];
/*Determines whether or not to score the current game*/
var dataScored = false;
/************************/
setInterval(function()
{
    var time = new Date();
    var seconds = time.getSeconds();
    if(lastEmitTime != seconds)
    {
        /*Game States*/
        switch(true)
        {
            /*Reset*/
                /*In this game state, reset the game variables*/
            case (seconds == 0):
                game.state = "Reset"
                canDoInput = false;
                dataScored = false;
                gameInput = [];
                io.emit("out-result", {results: gameInput});
                game = new classes.Game();
                break;
            /*Input*/
                /*In this game state, the player is allowed to do input*/
            case (seconds <= 50):
                game.state = "Input"
                canDoInput = true;
                break;
            /*Results*/
                /*In this game state, report the results of the game to the players*/
            default:
                game.state = "Results"
                canDoInput = false;
                if(!dataScored)
                {
                    scoreData();
                    dataScored = true;
                    io.emit("out-result", {results: gameInput});
                }
                break;
        }
        io.emit("get-time-game", {second : seconds, game: game});
        lastEmitTime = seconds;
    };
}, 60);
/*Calculate the results from a given game and return the data*/
function scoreData()
{
    var input1Score = 0;
    var input2Score = 0;
    var input3Score = 0;
    for(var i = 0; i < gameInput.length; i +=1)
    {
        switch(gameInput[i].input)
        {
            case 1:
                input1Score += 1;
                break;
            case 2:
                input2Score += 1;
                break;
            case 3:
                input3Score += 1;
                break;
                default:
                    console.log("Player made an invalid input");
                break;
        };
    }
    var check = [
        {value: 1, score: input1Score},
        {value: 2, score: input2Score},
        {value: 3, score: input3Score}
    ];
    var toReward = [check[0]];
    for(var i = 1; i < check.length; i += 1) {
        if (check[i].score > toReward[0].score) {
            toReward = [];
            toReward.push(check[i])
        }
        else if (check[i].score === toReward[0].score) {
            toReward.push(check[i])
        }
    }
    io.emit("got-winners", {winners: toReward});
    for(var i = 0; i < toReward.length; i +=1)
    {
        rewardScore(toReward[i].value);
    }
};
function rewardScore(score)
{
    for(var i = 0; i < gameInput.length; i += 1)
    {
        for(var j = 0; j < players.length; j += 1)
        {
            if(gameInput[i].name === players[j].name)
            {
                if(gameInput[i].input == score)
                {
                    players[j].numWins += 1;
                }
            }
        }
    }
};