export class ScoreManager {
    static score = 0;
    static scoreText = document.querySelector("#scorenumber");

    static _callbacks = [];
    static addCallback(callback) {
        ScoreManager._callbacks.push(callback);
    }

    static add(points) {
        console.log(`Hit obstacle worth ${points} points`);
        ScoreManager.score += points;
        ScoreManager.scoreText.innerHTML = ScoreManager.score;

        for(const callback of ScoreManager._callbacks) {
            callback(ScoreManager.score);
        }
    }
}
