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
    if(name != "")
    {
        if(password != "")
        {
            socket.emit("register", {id: socket.id, name: name, password: password});
        }
        else
        {
            document.getElementById("register").innerHTML = "Register<br>Please enter a valid password";
        }
    }
    else
    {
        document.getElementById("register").innerHTML = "Register<br>Please enter a valid name";
    }
};
function displayGame()
{
    document.getElementById("title").style.display = "none";
    document.getElementById("state").style.display = "none";
    document.getElementById("login-register").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("player").style.display = "block";
    document.getElementById("about").style.display = "none";
};
socket.on("register-success", function(data)
{
    document.getElementById("player").value = data.name;
    document.getElementById("l-r-name").value = "";
    document.getElementById("l-r-pass").value = "";
    player = data.player;
    displayGame()
});
socket.on("register-fail", function(data)
{
    document.getElementById("register").innerHTML = "Register<br>" + data.message;
});
function login(name, password)
{
    var name = document.getElementById("l-r-name").value
    var password = document.getElementById("l-r-pass").value
    socket.emit("login", {id: socket.id, name: name, password: password});
};
socket.on("login-success", function(data)
{
    player = data.player;
    document.getElementById("player").value = data.player.name + ", " + data.player.numWins + "/" + data.player.numGames;
    document.getElementById("l-r-name").value = "";
    document.getElementById("l-r-pass").value = "";
    displayGame()
});
socket.on("login-fail", function(data)
{
    document.getElementById("register").innerHTML = "Register<br>" + data.message;
});
/********************************/
/*Message Handling*/
socket.on('get-time-game', function (data)
{
    game = data.game;
    time = data.second;
    var state_div = document.getElementById("state");
    state_div.innerHTML = game.state;
    var time_div = document.getElementById("time");
    time_div.innerHTML = 60 - time;
    var time_message_div = document.getElementById("time-message");
    switch(game.state)
    {
        case "Input":
            time_message_div.innerHTML = "Select a noun";
            break;
        case "Results":
            time_message_div.innerHTML = "Showing results";
            break;
        /*State = Reset*/
        default:
            time_message_div.innerHTML = "Preparing silly words";
            currentInput = 0;
            showSelection();
            break;
    };

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
    if(!didGetResults && state == "Results")
    {
        results = data;
        didGetResults = true;
        var results_div = document.getElementById("results");
        results_div.innerHTML = data;
    }
    getPlayer();
});
socket.on("out-player", function (data)
{
    player = data.player;
});
socket.on("got-winners", function(data)
{
    var game_noun1_div = document.getElementById("game-noun1");
    game_noun1_div.style.textDecoration = "line-through";
    var game_noun2_div = document.getElementById("game-noun2");
    game_noun2_div.style.textDecoration = "line-through";
    var game_noun3_div = document.getElementById("game-noun3");
    game_noun3_div.style.textDecoration = "line-through";
    for(var i = 0; i < data.winners.length; i += 1)
    {
        switch(data.winners[i].value)
        {
            case 1:
                game_noun1_div.style.textDecoration = "none";
                break;
            case 2:
                game_noun2_div.style.textDecoration = "none";
                break;
            case 3:
                game_noun3_div.style.textDecoration = "none";
                break;
            default:
                break;
        };
    }
    switch(currentInput)
    {
        case 1:
            game_noun1_div.style.textDecoration += " underline";
            break;
        case 2:
            game_noun2_div.style.textDecoration += " underline";
            break;
        case 3:
            game_noun3_div.style.textDecoration += " underline";
            break;
        default:
            break;
    }
});
/******************/
/*Gameplay Related Functions*/
function input1()
{
    currentInput = 1;
    socket.emit("gameInput", {name: player.name, input: 1});
    showSelection();
};
function input2()
{
    currentInput = 2;
    socket.emit("gameInput", {name: player.name, input: 2});
    showSelection();
};
function input3()
{
    currentInput = 3;
    socket.emit("gameInput", {name: player.name, input: 3});
    showSelection();
};
function getPlayer()
{
    socket.emit("get-player", {id: socket.id});
};
function showSelection()
{
    switch(currentInput)
    {
        case 1:
            var game_noun1_div = document.getElementById("game-noun1");
            game_noun1_div.style.textDecoration = "underline";
            var game_noun2_div = document.getElementById("game-noun2");
            game_noun2_div.style.textDecoration = "none";
            var game_noun3_div = document.getElementById("game-noun3");
            game_noun3_div.style.textDecoration = "none";
            break;
        case 2:
            var game_noun1_div = document.getElementById("game-noun1");
            game_noun1_div.style.textDecoration = "none";
            var game_noun2_div = document.getElementById("game-noun2");
            game_noun2_div.style.textDecoration = "underline";
            var game_noun3_div = document.getElementById("game-noun3");
            game_noun3_div.style.textDecoration = "none";
            break;
        case 3:
            var game_noun1_div = document.getElementById("game-noun1");
            game_noun1_div.style.textDecoration = "none";
            var game_noun2_div = document.getElementById("game-noun2");
            game_noun2_div.style.textDecoration = "none";
            var game_noun3_div = document.getElementById("game-noun3");
            game_noun3_div.style.textDecoration = "underline";
            break;
        default:
            var game_noun1_div = document.getElementById("game-noun1");
            game_noun1_div.style.textDecoration = "none";
            var game_noun2_div = document.getElementById("game-noun2");
            game_noun2_div.style.textDecoration = "none";
            var game_noun3_div = document.getElementById("game-noun3");
            game_noun3_div.style.textDecoration = "none";
            break;
    }
};
socket.on("cannot-input", function(data) {console.log(data.message);});
/****************************/