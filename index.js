// https://tmi.twitch.tv/group/user/username/chatters
const urlParams = new URLSearchParams(window.location.search);

//Create pixi app
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const app = new PIXI.Application({
    resizeTo: document.body,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    transparent: true
});
document.body.appendChild(app.view);

const loader = new PIXI.Loader();
loader.add("slime_body", "sprites/body.png");
loader.add("slime_mouse_eye", "sprites/mouses_eyes.png");
loader.add("slime_hat", "sprites/hat.png");
loader.load((loader, resources) => {
    let viewer_count = 0;
    let last_viewer_list = {};
    let viewer_list = {};
    let slime_index = 0;
    let slimes = [];

    // Text style
    const text_style = (color) => {
        return new PIXI.TextStyle({
            dropShadowAngle: 0,
            dropShadowColor: "white",
            dropShadowDistance: 1,
            fill: color,
            fontFamily: "LEMONMILK-Bold",
            fontSize: 13,
            fontWeight: "bold",
            strokeThickness: 4
        });
    };

    // Gravité
    const gravity = 9.81;
    const slime_speed = { min: 1, max: 3 };

    // Hats
    const hats = generateTextures(resources["slime_hat"].texture, 6, 11, 32, 48, 0, 0);
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

    // Jump
    const jump_proba = [
        {
            type: 0,
            proba: 90
        },
        {
            type: 1,
            proba: 8
        },
        {
            type: 2,
            proba: 1
        },
        {
            type: 3,
            proba: 1
        }
    ];

    // Bodies
    const bodies = [
        generateTextures(resources["slime_body"].texture, 1, 16, 32, 21, 0, 0),
        generateTextures(resources["slime_body"].texture, 1, 16, 32, 21, 32, 0),
        generateTextures(resources["slime_body"].texture, 1, 16, 32, 21, 64, 0),
        generateTextures(resources["slime_body"].texture, 1, 16, 32, 21, 96, 0),
        generateTextures(resources["slime_body"].texture, 1, 16, 32, 21, 128, 0)
    ];
    const bodies_proba = [
        {
            type: 0,
            proba: 50
        },
        {
            type: 1,
            proba: 20
        },
        {
            type: 2,
            proba: 15
        },
        {
            type: 3,
            proba: 10
        },
        {
            type: 4,
            proba: 5
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
        constructor(x, y, name, list) {
            this.x = x;
            this.y = y;
            this.name = name;

            this.pass_ground = false;
            this.dying = false;
            this.is_grounded = false;
            this.is_jumpîng = false;
            this.is_flipping = false;
            this.flip_direction = 1;
            this.angle = 0;
            this.direction = 0;

            this.scale = randomRange(1, 2.5, false);
            this.min_scale = { x: this.scale + 0.3, y: this.scale - 0.3 };

            this.jumpforce = randomRange(12, 20);
            this.jumpforce_boost = 0;
            this.objectif = randomRange(16 * this.scale, app.screen.width - (16 * this.scale));
            this.weight = randomRange(1, 1.5, false);
            this.speed = randomRange(slime_speed.min, slime_speed.max);
            this.yvelocity = 0;

            this.canBreath = false;
            this.breathTimer = 0;
            this.timeBreath = randomRange(10, 30, false);
            this.breathingIn = true;

            this.globalContainer = new PIXI.Container();
            this.globalContainer.zindex = randomRange(0, 5);
            this.globalContainer.x = this.x;
            this.globalContainer.y = this.y;

            this.container = new PIXI.Container();
            this.container.scale.x = this.scale;
            this.container.scale.y = this.scale;
            this.container.sortableChildren = true;

            this.body_texture = bodies[randomProba(bodies_proba)][randomRange(0, 15)];
            this.body = createSprite(this.body_texture, 0, 0, 1, 0, { x: 0.5, y: 1 }, { x: 1, y: 1 });
            this.body.zindex = 0;

            this.eye_texture = eyes[randomRange(0, eyes.length - 1)];
            this.eye = createSprite(this.eye_texture, 0, -13, 1, 0, { x: 0.5, y: 0.5 }, { x: 1.2, y: 1.2 });
            this.eye.zindex = 1;

            this.mouse_texture = mouses[randomRange(0, mouses.length - 1)];
            this.mouse = createSprite(this.mouse_texture, 0, -7, 1, 0, { x: 0.5, y: 0.5 }, { x: 1.2, y: 1.2 });
            this.mouse.zindex = 1;

            this.hat_texture = randomProba(hats_proba) == -1 ? null : hats[randomRange(0, hats.length - 1)];
            this.hat = createSprite(this.hat_texture, 0, 0, 1, 0, { x: 0.5, y: 1 }, { x: Math.random() >= 0.5 ? 1 : - 1, y: 1 });
            this.hat.zindex = 2;

            this.container.addChild(this.body);
            this.container.addChild(this.mouse);
            this.container.addChild(this.eye);
            this.container.addChild(this.hat);

            switch (list) {
                case "vips":
                    this.color = 0x273c75;
                    break;

                case "moderators":
                    this.color = 0x4cd137;
                    break;

                case "staff":
                    this.color = 0xe84118;
                    break;

                case "admins":
                    this.color = 0xfbc531;
                    break;

                case "global_mods":
                    this.color = 0x9c88ff;
                    break;

                case "viewers":
                    this.color = 0xf5f6fa;
                    break;

                default:
                    break;
            }
            this.textName = new PIXI.Text(this.name, text_style(this.color));
            this.textName.anchor.set(0.5, 1);
            this.textName.y = -this.container.height;

            this.globalContainer.addChild(this.container);
            this.globalContainer.addChild(this.textName);

            app.stage.addChild(this.globalContainer);

            this.randomJump();
        }

        update(deltaTime) {
            if (this.is_flipping) {
                if (this.flip_direction == 1) {
                    if (this.container.angle < 360) {
                        this.container.angle += ((this.jumpforce + this.jumpforce_boost) * this.weight) * deltaTime;
                    }
                    else {
                        this.container.angle = 0;
                        this.is_flipping = false;
                    }
                }
                else if (this.flip_direction == -1) {
                    if (this.container.angle > -360) {
                        this.container.angle -= ((this.jumpforce + this.jumpforce_boost) * this.weight) * deltaTime;
                    }
                    else {
                        this.container.angle = 0;
                        this.is_flipping = false;
                    }
                }
            }

            // Mouvement
            if (this.is_grounded) {
                if (this.objectif - 5 < this.globalContainer.x && this.objectif + 5 > this.globalContainer.x) {
                    this.objectif = randomRange(16 * this.scale, app.screen.width - (16 * this.scale));
                    return;
                }

                if (this.globalContainer.x < this.objectif) {
                    this.direction = 0;
                }
                else if (this.globalContainer.x > this.objectif) {
                    this.direction = 1;
                }
            }
            else {
                if (this.direction == 1 && this.globalContainer.x < (16 * this.scale)) {
                    this.direction = 0;
                }

                if (this.direction == 0 && this.globalContainer.x > app.screen.width - (16 * this.scale)) {
                    this.direction = 1;
                }
            }

            this.globalContainer.y += this.yvelocity * deltaTime;
            this.globalContainer.x += this.direction == 0 ? this.speed * deltaTime : -this.speed * deltaTime;

            // Gravité
            if (!this.pass_ground) {
                if (this.globalContainer.y < app.screen.height) {
                    this.is_grounded = false;
                    this.yvelocity += this.yvelocity < gravity * 2 ? gravity * this.weight * deltaTime / 10 : 0;
                }
                else if (this.globalContainer.y >= app.screen.height) {
                    this.is_grounded = true;
                    this.is_jumpîng = false;
                    this.yvelocity = 0;
                    this.globalContainer.y = app.screen.height;
                }
            }
            else {
                this.yvelocity += this.yvelocity < gravity * 2 ? gravity * this.weight * deltaTime / 10 : 0;
            }

            this.breath(deltaTime);
        }

        randomJump(forceJump = null) {
            setTimeout(() => {
                switch (forceJump || randomProba(jump_proba)) {
                    case 1: this.jump(); break;
                    case 2: this.backFlip(); break;
                    case 3: this.frontFlip(); break;
                    default: break;
                }
                this.randomJump();
            }, randomRange(500, 2500));
        }

        backFlip() {
            if (!this.is_flipping) {
                this.flip_direction = - 1;
                this.jump();
                this.is_flipping = true;
            }
        }

        frontFlip() {
            if (!this.is_flipping) {
                this.flip_direction = 1;
                this.jump();
                this.is_flipping = true;
            }
        }

        jump() {
            if (!this.is_jumpîng && this.is_grounded) {
                this.is_jumpîng = true;
                this.jumpforce_boost = randomRange(-3, 3);
                this.yvelocity -= this.jumpforce + this.jumpforce_boost;
            }
        }

        breath(deltaTime) {
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

        move(x, y) {
            this.globalContainer.x = x;
            this.globalContainer.y = y;
        }

        die() {
            if (!this.dying) {
                this.dying = true;
                this.jump();
                this.pass_ground = true;
                setTimeout(() => {
                    this.globalContainer.destroy({ children: true });
                    removeSlime(this);
                }, 1000);
            }
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
            return Math.floor(Math.random() * (max - min) + min);
        }
        else {
            return Math.random() * (max - min) + min;
        }

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

    function addSlime(name, list) {
        slimes[slime_index] = new Slime(randomRange(16, app.screen.width - 16), randomRange(64, app.screen.height - 64), name, list);
        slime_index++;
    }

    function removeSlime(slime) {
        slimes.splice(slimes.indexOf(slime), 1);
        slime_index--;
    }

    function updateSlime(count, viewerList) {
        console.log(viewerList);

        last_viewer_count = viewer_count;
        viewer_count = count;

        last_viewer_list = viewer_list;
        viewer_list = viewerList;

        for (last_list in last_viewer_list) {
            if (last_list != "broadcaster") {
                for (let i = 0; i < last_viewer_list[last_list].length; i++) {
                    if (viewer_list[last_list].indexOf(last_viewer_list[last_list][i]) == -1) {
                        for (let j = 0; j < slimes.length; j++) {
                            if (slimes[j].name == last_viewer_list[last_list][i]) {
                                slimes[j].die();
                                break;
                            }
                        }
                    }
                }
            }
        }

        for (list in viewer_list) {
            if (list != "broadcaster") {
                for (let i = 0; i < viewer_list[list].length; i++) {
                    console.log(last_viewer_list[list]);
                    if (last_viewer_list[list] == undefined || last_viewer_list[list].indexOf(viewer_list[list][i]) == -1) {
                        addSlime(viewer_list[list][i], list);
                    }
                }
            }
        }
    }

    function getViewerCount() {
        $.ajax({
            url: `https://tmi.twitch.tv/group/user/${urlParams.get("streamer").toLowerCase()}/chatters`,
            dataType: "jsonp",
            success: function (data) {
                updateSlime(data.data.chatter_count - 1, data.data.chatters);
            }
        });
    }

    getViewerCount();
    setInterval(() => {
        getViewerCount();
    }, 30000);

    app.ticker.add((deltaTime) => {
        for (let i in slimes) {
            slimes[i].update(deltaTime);
        }
    });
});

app.loader.onError.add((error) => console.error(error));