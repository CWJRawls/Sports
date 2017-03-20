inlets = 1
outlets = 3

var score_team1 = 0;
var score_team2 = 0;
var t1_ballNum = 0;
var t2_ballNum = 0;
var current_throw = 0; // 0 - red 1 - blue
var start_enable = true;
var practice_enable = true;
var current_mode = 0 // 0 - waiting to start 1 - game 2 - practice
var end_count = 0;
var max_ends = 3;
var jack_throw = false;
var balls_rolling = false;
var ready_to_score = false;

/* NOTES FOR MYSELF 
possible outputs from outlet 2 (left outlet)
end - what end is it
score - what is the current score for both teams
scoring - ready to get distances for scoring end
throw - which team is throwing
phase - throwing jack or balls
display - 0 for throw 1 for balls
winner - who won

possible outputs from outlet 1 (middle outlet)
jack - current position and velocity of the jack
1 or 0 - ball position and velocity from throw

END NOTES*/

//function to determine if the game should start
function startPosition(pos) {
	
	x = arguments[0]
	y = arguments[1]
	z = arguments[2]
	
	dx = Math.abs(x - 0.5);
	
	dz = Math.abs(z - 0.445);
	if(start_enable)
	{
		if(dx < 0.05 && dz < 0.05)
		{
			outlet(0, 1);
			start_enable = false;
		}
		else 
		{
			outlet(0,0);
		}
	}
	else
	{
		post("Game Already Started\n")
	}
}

function startPractice()
{

	if(practice_enable)
	{
		current_mode = 2;
		start_enable = false;
		practice_enable = false;
	}
	else
	{
		post("Practice Mode Unreachable!\n");
	}
}

function startGame()
{
	if(start_enable)
	{	
		//set modes and flags
		current_mode = 1;
		start_enable = false;
		practice_enable = false;
		jack_throw = false;
		score_team1 = 0;
		score_team2 = 0;
		
		//set which end it is
		end_count = 0;
		
		//outlet what end it is
		var endcount = new Array();
		endcount.push("end");
		endcount.push(end_count + 1);
		outlet(2, endcount);
		
		//outlet the current score
		var score = new Array();
		score.push("score");
		score.push(score_team1);
		score.push(score_team2);
		outlet(2, score);
		
		//set the next throw to be the jack
		var throws = new Array();
		throws.push("phase");
		throws.push(0);
		outlet(2, throws);
		
		//randomly choose the first team to throw
		var cthrows = new Array();
		cthrows.push("throw");
		current_throw = Math.round(Math.random());
		cthrows.push(current_throw);
		outlet(2, cthrows);
		
		//enable the throw display
		var display = new Array();
		display.push("display");
		display.push(0);
		outlet(2,display);
				
	}
	else
	{
		post("Either already playing or in practice mode!\n");
	}
}

//function to allow for game to reset
function resetGame()
{
	score_team1 = 0;
	scare_team2 = 0;
	start_enable = true;
	practice_enable = true;
	jack_throw = false;
	current_mode = 0;
	outlet(0,0); //turn the opening scene on
	resetBalls();
	
	var score = new Array();
	score.push("score");
	score.push(0);
	score.push(0);
	outlet(2,score);
	
	var end = new Array();
	end.push("end");
	end.push(0);
	outlet(2, end);
	
	var throws = new Array();
	throws.push("throw");
	throws.push(2);
	outlet(2, throws);
}

function setBallVelocity(vel)
{
	x = arguments[0];
	y = arguments[1];
	z = arguments[2];
	
	dx = arguments[3];
	dy = arguments[4];
	dz = arguments[5];
	
	if(current_mode > 0 && jack_throw && !ready_to_score && !balls_rolling) {
	
		var display = new Array();
		display.push("display");
		display.push(1);
		outlet(2, display);

		var delta = new Array();
	
	
		delta.push(current_throw);
	
		if(current_throw == 0)
		{
			delta.push(t1_ballNum);
			current_throw = 1;
			t1_ballNum++;
		}
		else
		{
			delta.push(t2_ballNum);
			current_throw = 0;
				t2_ballNum++;
		}
		
		delta.push(x);
		delta.push(y);
		delta.push(z);
		delta.push(dx);
		delta.push(dy);
		delta.push(dz);
	
		outlet(1,delta);
		balls_rolling = true;
		
		if(t1_ballNum > 3 && t2_ballNum > 3)
		{
			if(current_mode == 1)//game mode
			{
				ready_to_score = true;
			}
			else //practice mode
			{
				t1_ballNum = 0;
				t2_ballNum = 0;
			}
		}
	}
	else {
		post("Not Ready to throw!\n");
	}
}

function throwJack(vel)
{
	if(!jack_throw && current_mode > 0)
	{
		x = arguments[0];
		y = arguments[1];
		z = arguments[2];
		dx = arguments[3];
		dy = arguments[4];
		dz = arguments[5];
		
		var delta = new Array();
		
		delta.push("jack");
		delta.push(x);
		delta.push(y);
		delta.push(z);
		delta.push(dx);
		delta.push(dy);
		delta.push(dz);
		
		outlet(1, delta);
		jack_throw = true;
		balls_rolling = true;
		
		var phase = new Array();
		phase.push("phase");
		phase.push(1);
		outlet(2,phase);
	}
	
	post("Jack already thrown\n");
}

function ballsStopped()
{
	if(balls_rolling)
	{
		balls_rolling = false;
		
		if(ready_to_score)
		{
			var output = new Array();
			output.push("scoring");
			
			outlet(2, output);
		}
		else
		{
			getCurrentThrow();
			
			var display = new Array();
			display.push("display");
			display.push(0);
			outlet(2,display);
		}
	}
	else
	{
		post("No Balls Were Moving!\n");
	}
}

function scoreBalls(dist)
{
	if(ready_to_score && !balls_rolling)
	{
		t11 = arguments[0];
		t12 = arguments[1];
		t13 = arguments[2];
		t14 = arguments[3];
		t21 = arguments[4];
		t22 = arguments[5];
		t23 = arguments[6];
		t24 = arguments[7];
		
		minT1 = findMin(t11,t12,t13,t14);
		minT2 = findMin(t21,t22,t23,t24);
		
		var result = new Array();
		
		result.push("score");
		
		if(minT1 < minT2)
		{
			post("Team 1 Scores!\n");
			
			amount = 0;
			
			for(var i = 0; i < 4; i++)
			{
				if(arguments[i] < minT2)
				{
					amount++;
				}
			}

			score_team1 += amount;
			
			current_throw = 0;
		}
		else if(minT1 > minT2)
		{
			post("Team 2 Scores!\n");
			
			amount = 0;
			
			for(var i = 4; i < 8; i++)
			{
				if(arguments[i] < minT1)
				{
					amount++;
				}
			}
			
			score_team2 += amount;
			
			current_throw = 1;
		}
		else
		{
			post("Tie! Both Teams Score 1 Point!\n");
			
			score_team1++;
			score_team2++;
			
			current_throw = Math.round(Math.random());
		}
		
		ready_to_score = false;
		jack_throw = false;
		t1_ballNum = 0;
		t2_ballNum = 0;
		
		result.push(score_team1);
		result.push(score_team2);
		outlet(2, result);
		
		end_count++;
		
		if(end_count == max_ends)
		{
			var winner = new Array();
			
			winner.push("winner");
			
			if(score_team1 > score_team2)
			{
				winner.push(1);
			}
			else if(score_team1 < score_team2)
			{
				winner.push(2);
			}
			else
			{
				winner.push(3);
			}
			
			outlet(2, winner);
			current_mode = 0;
		}
		else
		{
			var jackthrow = new Array();
			jackthrow.push("phase");
			jackthrow.push(0);
			outlet(2, jackthrow);
			
			getCurrentThrow();
			
			resetBalls();
			
			var end = new Array();
			end.push("end");
			end.push(end_count + 1);
			outlet(2, end);
		}
		
		var display = new Array();
		display.push("display");
		display.push(0);
		outlet(2, display);
			
	}
	else
	{
		post("Not Ready To Score the round!\n");
	}
}

function findMin(a,b,c,d) {
	
	if(a < b && a < c && a < d) {
		return a;
	}
	else if(b < c && b < d) {
		return b;
	}
	else if(c < d) {
		return c;
	}
	else {
		return d;
	}
}	

function getCurrentThrow()
{
	var result = new Array();
	
	result.push("throw");
	
	result.push(current_throw);

	outlet(2, result);
}

function setMaxEnds(ends)
{
	if(start_enable || current_mode != 1)
	{
		ends = arguments[0];
		max_ends = ends;
	}
	else
	{
		post("Currently In Game, Can't Set Max Ends!\n");
	}
}

function getScore()
{
	if(current_mode == 1)
	{
		var score = new Array();
		
		score.push("score");
		score.push(score_team1);
		score.push(score_team2);
		
		outlet(1, score);
		
		var end = new Array();
		end.push("end");
		end.push(end_count);
		outlet(2, end);
	}
	else
	{
		post("Either Game has not started or practicing, no score!\n");
	}
}

function resetBalls()
{
	var x = -2.5;
	var y = -10.0;
	var z = -4;
	
	for(var i = 0; i < 2; i++)
	{
		for(var j = 0; j < 4; j++)
		{
			var ball = new Array();
			
			ball.push(i);
			ball.push(j);
			ball.push(x);
			ball.push(y);
			ball.push(z);
			ball.push(0);
			ball.push(0);
			ball.push(0);
			
			outlet(1, ball);
			
			x += 0.625;
		}
	}
	
	var jack = new Array();
	jack.push("jack");
	jack.push(0);
	jack.push(-9.5);
	jack.push(-4);
	jack.push(0);
	jack.push(0);
	jack.push(0);
	
	outlet(1, jack);
}
