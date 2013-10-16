<?php

if($_POST){
	file_put_contents("top_score.txt", $_POST["score"]);
	file_put_contents("top_player.txt", $_POST["name"]);
}
