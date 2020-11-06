//const socket = io('wss://heat-ebs.j38.net/');

//Create pixi app
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const app = new PIXI.Application({
    resizeTo: document.body,
    autoDensity: true,
    backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1,
    transparent: true
});
document.body.appendChild(app.view);

const loader = new PIXI.Loader();
loader.add("slime_body", "sprites/body.png");
loader.add("slime_mouse_eye", "sprites/mouses_eyes.png");
loader.add("slime_hat", "sprites/hat.png");
loader.load((loader, resources) => {
    let deltaTime = 0;

    // Gravité
    const gravity = 9.81;
    const slime_speed = { min: 1, max: 3 };

    // Hats
    const hats = generateTextures(resources["slime_hat"].texture, 6, 6, 16, 16, 0, 0);
    const hats_proba = [
        {
            type: -1,
            proba: 50
        },
        {
            type: 0,
            proba: 50
        }
    ];

    // Bodies
    const bodies = generateTextures(resources["slime_body"].texture, 3, 1, 32, 21, 0, 0);
    const bodies_proba = [
        {
            type: 0,
            proba: 60
        },
        {
            type: 1,
            proba: 20
        },
        {
            type: 2,
            proba: 20
        }
    ];

    // Mouses
    const mouses = generateTextures(resources["slime_mouse_eye"].texture, 10, 2, 16, 8, 0, 16);

    // Eyes
    const eyes = generateTextures(resources["slime_mouse_eye"].texture, 10, 2, 16, 8, 0, 0);

    // Colors
    const eye_colors = [
        0x000000
    ];

    const colors = [
        {
            color: 0xFFC312,
            shadow: 0xF79F1F
        },
        {
            color: 0xC4E538,
            shadow: 0xA3CB38
        },
        {
            color: 0x12CBC4,
            shadow: 0x1289A7
        },
        {
            color: 0xFDA7DF,
            shadow: 0xD980FA
        },
        {
            color: 0xED4C67,
            shadow: 0xB53471
        },
        {
            color: 0xEE5A24,
            shadow: 0xEA2027
        },
        {
            color: 0x009432,
            shadow: 0x006266
        },
        {
            color: 0x0652DD,
            shadow: 0x1B1464
        },
        {
            color: 0x9980FA,
            shadow: 0x5758BB
        },
        {
            color: 0x833471,
            shadow: 0x6F1E51
        },
    ]

    // Slime
    class Slime {
        constructor(x, y) {
            this.x = x;
            this.y = y;

            this.is_grounded = false;
            this.is_jumpîng = false;
            this.direction = 0;

            this.jumpforce = randomRange(10, 20);
            this.objectif = randomRange(64, app.screen.width - 64);
            this.weight = randomRange(1, 2, false);
            this.speed = randomRange(slime_speed.min, slime_speed.max);
            this.yvelocity = 0;

            this.scale = randomRange(1.5, 2, false);
            this.min_scale = { x: this.scale + 0.3, y: this.scale - 0.3 };

            this.canBreath = false;
            this.breathTimer = 0;
            this.timeBreath = randomRange(10, 30, false);
            this.breathingIn = true;

            this.container = new PIXI.Container();
            this.container.zindex = randomRange(0, 5);
            this.container.x = this.x;
            this.container.y = this.y;
            this.container.scale.x = this.scale;
            this.container.scale.y = this.scale;
            this.container.sortableChildren = true;

            this.body_texture = bodies[randomProba(bodies_proba)];
            this.body = createSprite(this.body_texture, 0, 0, 1, 0, { x: 0.5, y: 1 }, { x: 1, y: 1 });
            this.body.zindex = 0;
            this.changeColor();

            this.eye_texture = eyes[randomRange(0, eyes.length - 1)];
            this.eye = createSprite(this.eye_texture, 0, -13, 1, 0, { x: 0.5, y: 0.5 }, { x: 1.2, y: 1.2 });
            this.eye.zindex = 1;
            this.changeEyeColor();

            this.mouse_texture = mouses[randomRange(0, mouses.length - 1)];
            this.mouse = createSprite(this.mouse_texture, 0, -7, 1, 0, { x: 0.5, y: 0.5 }, { x: 1.2, y: 1.2 });
            this.mouse.zindex = 1;

            this.hat_texture = randomProba(hats_proba) == -1 ? null : hats[randomRange(0, hats.length - 1)];
            this.hat = createSprite(this.hat_texture, 0, -19, 1, 0, { x: 0.5, y: 1 }, { x: Math.random() >= 0.5 ? 1.2 : - 1.2, y: 1.2 });
            this.hat.zindex = 2;

            this.container.addChild(this.body);
            this.container.addChild(this.mouse);
            this.container.addChild(this.eye);
            this.container.addChild(this.hat);

            app.stage.addChild(this.container);
        }

        update() {
            // Mouvement
            if (this.is_grounded) {
                if (this.objectif - 5 < this.container.x && this.objectif + 5 > this.container.x) {
                    this.objectif = randomRange(64, app.screen.width - 64);
                    return;
                }

                if (this.container.x < this.objectif) {
                    this.direction = 0;
                }
                else if (this.container.x > this.objectif) {
                    this.direction = 1;
                }
            }

            this.container.y += this.yvelocity * deltaTime;
            this.container.x += this.direction == 0 ? this.speed * deltaTime : -this.speed * deltaTime;

            // Gravité
            if (this.container.y < app.screen.height) {
                this.is_grounded = false;
                this.yvelocity += this.yvelocity < gravity * 2 ? gravity * this.weight * deltaTime / 10 : 0;
            }
            else if (this.container.y >= app.screen.height) {
                this.is_grounded = true;
                this.is_jumpîng = false;
                this.yvelocity = 0;
                this.container.y = app.screen.height;
            }

            this.breath();
        }

        jump() {
            if (!this.is_jumpîng && this.is_grounded) {
                this.is_jumpîng = true;
                this.yvelocity -= this.jumpforce + randomRange(-5, 5, false);
            }
        }

        breath() {
            if (this.canBreath == false) {
                this.breathTimer += deltaTime;
                if (this.breathTimer > this.timeBreath) {
                    this.canBreath = true;
                    this.breathTimer = 0;
                }
            }

            if (this.canBreath) {
                if (this.breathingIn) {
                    this.container.scale.y -= (this.speed / 200) * deltaTime;
                    this.container.scale.x += (this.speed / 200) * deltaTime;
                    if (this.container.scale.x > this.min_scale.x && this.container.scale.y < this.min_scale.y) {
                        this.breathingIn = false;
                    }
                }
                else {
                    this.container.scale.y += (this.speed / 200) * deltaTime;
                    this.container.scale.x -= (this.speed / 200) * deltaTime;
                    if (this.container.scale.x < this.scale && this.container.scale.y > this.scale) {
                        this.timeBreath = randomRange(10, 30, false);
                        this.canBreath = false;
                        this.breathingIn = true;
                    }
                }
            }
        }

        changeEyeColor() {
            this.eye_color = eye_colors[randomRange(0, eye_colors.length - 1)];
            this.eye.filters = [
                new PIXI.filters.ColorReplaceFilter(0xff0000, this.eye_color, 0.001)
            ];
        }

        changeColor() {
            this.colors = colors[randomRange(0, colors.length - 1)];
            this.body.filters = [
                new PIXI.filters.ColorReplaceFilter(0xffffff, this.colors.color, 0.001),
                new PIXI.filters.ColorReplaceFilter(0x00ff00, this.colors.shadow, 0.001)
            ];
        }

        move(x, y) {
            this.container.x = x;
            this.container.y = y;
        }
    }

    let slimes = [];
    let index = 0;
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 10; x++) {
            slimes[index] = new Slime((x + 1) * 156, (y + 1) * 128);
            index++;
        }
    }

    // Functions
    function randomProba(proba_list) {
        let value = Math.random() * 100;
        let totalproba = 0;
        for (let i = 0; i < proba_list.length; i++) {
            if (i == 0 && value <= (totalproba += proba_list[i].proba)) {
                return proba_list[i].type;
            }
            else if (i != 0 && value > proba_list[i - 1].proba && value <= (totalproba += proba_list[i].proba)) {
                return proba_list[i].type;
            }
        }
    }

    function randomRange(min, max, int = true) {
        if (int) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }
        else {
            return Math.random() * (max - min + 1) + min;
        }

    }

    function logClick(x, y) {
        slimes[randomRange(0, slimes.length - 1)].jump();
        console.log(x, y);
    }

    function generateTextures(texture, nbr_tile_x, nbr_tile_y, tile_size_x, tile_size_y, offset_x = 0, offset_y = 0) {
        let textures = [];
        let index = 0;
        for (let y = 0; y < nbr_tile_y; y++) {
            for (let x = 0; x < nbr_tile_x; x++) {
                textures[index] = new PIXI.Texture(
                    texture,
                    new PIXI.Rectangle(offset_x + (x * tile_size_x), offset_y + (y * tile_size_y), tile_size_x, tile_size_y)
                );
                index++;
            }
        }
        return textures;
    }

    function createSprite(texture, x, y, alpha = 1, angle = 0, anchor = { x: 0.5, y: 0.5 }, scale = { x: 1, y: 1 }) {
        let sprite = new PIXI.Sprite(texture);
        sprite.x = x;
        sprite.y = y;
        sprite.alpha = alpha;
        sprite.angle = angle;
        sprite.anchor.set(anchor.x, anchor.y);
        sprite.scale.x = scale.x;
        sprite.scale.y = scale.y;
        return sprite;
    }

    app.ticker.add((_deltaTime) => {
        deltaTime = _deltaTime / 2;
    });

    // // Once connected, join a Twitch channel with your numeric channel id.
    // socket.on('connect', () => {
    //     socket.emit("channel", 174535992);
    // });

    // // Now, listen for click events.
    // socket.on('click', (data) => {
    //     const clickData = JSON.parse(data);
    //     logClick(clickData.x, clickData.y);
    // });

    document.addEventListener("click", (event) => {
        const normalizedX = (event.clientX * 1.0 / window.innerWidth).toPrecision(3);
        const normalizedY = (event.clientY * 1.0 / window.innerHeight).toPrecision(3);

        logClick(normalizedX, normalizedY);
    });

    setInterval(() => {
        for (let i in slimes) {
            slimes[i].update(deltaTime);
        }
    }, 1000 / 30);

    setInterval(() => {
        logClick(0, 0);
    }, 100);
});

app.loader.onError.add((error) => console.error(error));