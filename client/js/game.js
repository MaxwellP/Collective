/**
 * Created by Maxwell on 2/15/2015.
 */

var socket = io.connect();
/************************/
/*Classes*/
var Player = function(id, name, password)
{
    this.id = id;
    this.name = name;
    this.password = password;
    this.numWins = 0;
    this.numGames = 0;
};
/*********/
/*Game Related Vairables*/
var time;
var state;
var game;
var didGetResults;
var results;
var player = new Player();
var currentInput;
/************************/
/*Account Registration and Login*/
function register()
{
    var name = document.getElementById("l-r-name").value
    var password = document.getElementById("l-r-pass").value
    console.log("ATTEMPTED REGISTRATION");
    console.log("    " + name);
    console.log("    " + password);
    if(name != "")
    {
        if(password != "")
        {
            socket.emit("register", {id: socket.id, name: name, password: password});
        }
        else
        {
            console.log("Please enter a valid password");
        }
    }
    else
    {
        console.log("Please enter a valid name");
    }
};
socket.on("register-success", function(data)
{
    console.log("You successfully registered, " + data.player.name);
    console.log(data);
    document.getElementById("player").value = data.name;
    document.getElementById("l-r-name").value = "";
    document.getElementById("l-r-pass").value = "";
    player = data.player;
});
socket.on("register-fail", function(data)
{
    console.log(data.message);
});
function login(name, password)
{
    var name = document.getElementById("l-r-name").value
    var password = document.getElementById("l-r-pass").value
    console.log("ATTEMPTED LOGIN");
    console.log("    " + name);
    console.log("    " + password);
    socket.emit("login", {id: socket.id, name: name, password: password});
};
socket.on("login-success", function(data)
{
    console.log("Welcome back, " + data.player.name);
    player = data.player;
    console.log(data);
    document.getElementById("player").value = data.player.name + ", " + data.player.numWins + "/" + data.player.numGames;
    document.getElementById("l-r-name").value = "";
    document.getElementById("l-r-pass").value = "";
});
socket.on("login-fail", function(data)
{
    console.log(data.message);
});
/********************************/
/*Message Handling*/
socket.on('get-time-game', function (data)
{
    time = data.second;
    var time_div = document.getElementById("time");
    time_div.innerHTML = 60 - time;

    game = data.game;
    var state_div = document.getElementById("state");
    state_div.innerHTML = game.state;
    if(game.state === "Reset")
    {
        currentInput = 0;
    }

    var game_adj_div = document.getElementById("game-adj");
    game_adj_div.innerHTML = game.adjective;
    var game_noun1_div = document.getElementById("game-noun1");
    game_noun1_div.innerHTML = game.noun1;
    var game_noun2_div = document.getElementById("game-noun2");
    game_noun2_div.innerHTML = game.noun2;
    var game_noun3_div = document.getElementById("game-noun3");
    game_noun3_div.innerHTML = game.noun3;

    var results_div = document.getElementById("results");
    results_div.innerHTML = results;
    var player_id_div = document.getElementById("player-id");
    player_id_div.innerHTML = player.id;
    var player_name_div = document.getElementById("player-name");
    player_name_div.innerHTML = player.name;
    var player_numWins_div = document.getElementById("player-numWins");
    player_numWins_div.innerHTML = player.numWins;
    var player_numGames_div = document.getElementById("player-numGames");
    player_numGames_div.innerHTML = player.numGames;
});
socket.on("out-result", function(data)
{
    console.log(data);
    if(!didGetResults && state == "Results")
    {
        results = data;
        didGetResults = true;
        console.log(data);
        var results_div = document.getElementById("results");
        results_div.innerHTML = data;
    }
    getPlayer();
});
socket.on("out-player", function (data)
{
    player = data.player;
});
/******************/
/*Gameplay Related Functions*/
function input1()
{
    currentInput = 1;
    socket.emit("gameInput", {name: player.name, input: 1})
};
function input2()
{
    currentInput = 2;
    socket.emit("gameInput", {name: player.name, input: 2})
};
function input3()
{
    currentInput = 3;
    socket.emit("gameInput", {name: player.name, input: 3})
};
function getPlayer()
{
    socket.emit("get-player", {id: socket.id});
}
socket.on("cannot-input", function(data) {console.log(data.message);});
/****************************/