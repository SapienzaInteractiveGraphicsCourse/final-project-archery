import * as TWEEN from 'tween';

export class ScoreManager {
    static score = 0;
    static shownScore = 0;
    static scoreText = document.querySelector("#scorenumber");

    static _callbacks = [];
    static addCallback(callback) {
        ScoreManager._callbacks.push(callback);
    }

    static add(points) {
        console.log(`Hit obstacle worth ${points} points`);
        ScoreManager.shownScore = ScoreManager.score;
        ScoreManager.score += points;

        for(const callback of ScoreManager._callbacks) {
            callback(ScoreManager.score);
        }

        new TWEEN.Tween(ScoreManager)
            .to({shownScore: ScoreManager.shownScore + points}, 500)
            .onUpdate(() => ScoreManager.scoreText.innerHTML = ScoreManager.shownScore | 0)
            .start();
    }
}
