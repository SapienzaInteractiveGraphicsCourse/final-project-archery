import * as TWEEN from 'tween';

export class GameTime {
    static _now = 0;

    static advance(delta) {
        GameTime._now += delta;
    }
    static now() {
        return GameTime._now;
    }
}

/*
 Utility class to avoid having to call GameTime.now() at all start, pause, resume and update calls
*/
export class GameTimeTween extends TWEEN.Tween {
    constructor(object, group) {
        super(object, group);
    }
    start() { super.start(GameTime.now()); }
    pause() { super.pause(GameTime.now()); }
    resume() { super.resume(GameTime.now()); }
    update(_, autoStart) { super.update(GameTime.now(), autoStart); }
}
