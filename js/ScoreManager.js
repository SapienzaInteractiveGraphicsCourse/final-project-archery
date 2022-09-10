export class ScoreManager {
    static score = 0;
    static scoreText = document.querySelector("#scorenumber");

    static add(points) {
        console.log(`Hit obstacle worth ${points} points`);
        ScoreManager.score += points;
        ScoreManager.scoreText.innerHTML = ScoreManager.score;
    }
}
