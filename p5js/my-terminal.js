const font = 'Crazy';

const formatter = new Intl.ListFormat('en', {
    style: 'long',
    type: 'conjunction',
  });


const directories = {
    projects: [
        '<white>p5js_projects</white>',
        [
            ['snow_day',
                'snow_day/index.html',
                'audio reactive visualizer that i made for a little guitar jam. 11/12/25',
                'images/dithered-image.png'
            ],
            ['pixel_sorting',
                'sorting/index.html',
                'under construction. the goal is to make something that sorts the pixels in an image and animates the sorting process in some way'
            ],
            ['snow_flakes',
                'snow_flake/index.html',
                'another attempt at an audio reactive visualizer. this time with three.js. 11/15/25',
                'images/snow_flake_dither.png'
            ],
        ].map(([name, url, description = '', image = null]) => {
            const projectLine = `* <a href="${url}">${name}</a> &mdash; <white>${description}</white>`;
            const imageLine = image 
                ? `  <div style="text-align: center; margin-top: 5px; margin-bottom: 10px;"><a href="${url}" style="display: inline-block;"><img src="${image}" style="width: 300px; height: auto;"></a></div>` 
                : '';
            return imageLine ? `${projectLine}\n${imageLine}` : projectLine;
        }),
        ''
    ].flat()
};

const dirs = Object.keys(directories);

const root = '~';
let cwd = root;

function print_home() {
    term.echo(dirs.map(dir => {
        return `<blue class="directory">${dir}</blue>`;
    }).join('\n'));
}

const commandDescriptions = {
    help: 'display this help message with available commands',
    back: 'navigate back to the previous page',
    echo: 'display a line of text',
    cd: 'change directory (e.g., cd projects)',
    ls: 'list directory contents',
    open: 'open a project (e.g., open snow_day)',
    credits: 'show credits and libraries used',
    clear: 'clear the terminal screen',
    pwd: 'prints the current working directory'
};

const commands = {
    help() {
        const helpText = [
            '<white>Available commands:</white>',
            ""
        ];

        command_list.forEach(cmd => {
            const description = commandDescriptions[cmd] || 'No description available';
            helpText.push(`  <white>${cmd.padEnd(15)}</white> - ${description}`);
        });
        
        helpText.push('');
        term.echo(helpText.join('\n'));
        term.echo("\n<white> if you just want to see the projects type 'cd projects' to change you directory to the projects folder, then 'ls' and click on the project you want to view </white>")
    },
    back() {
        window.location.href = '../index.html';
    },
    home() {
        window.location.href = '../index.html'
    },
    echo(...args) {
        term.echo(args.join(' '));
    },

    pwd() {
        this.echo(cwd);
    },

    cd(dir = null) {
        if (dir === null || (dir === '..' && cwd !== root)) {
            cwd = root;
        } else if (dir.startsWith('~/') && dirs.includes(dir.substring(2))) {
            cwd = dir;
        } else if (dir.startsWith('../') && cwd !== root &&
                   dirs.includes(dir.substring(3))) {
            cwd = root + '/' + dir.substring(3);
        } else if (dirs.includes(dir)) {
            cwd = root + '/' + dir;
        } else {
            this.error('This directory does not exist');
        }
    },

    ls(dir = null) {
        if (dir) {
            if (dir.match(/^~\/?$/)) {
                // ls ~ or ls ~/
                print_home();
            } else if (dir.startsWith('~/')) {
                const path = dir.substring(2);
                const dirs = path.split('/');
                if (dirs.length > 1) {
                    this.error('Invalid directory');
                } else {
                    const dir = dirs[0];
                    this.echo(directories[dir].join('<br><br>'), { raw: true });
                }
            } else if (cwd === root) {
                if (dir in directories) {
                    this.echo(directories[dir].join('<br><br>'), { raw: true });
                } else {
                    this.error('Invalid directory');
                }
            } else if (dir === '..') {
                print_home();
            } else {
                this.error('Invalid directory');
            }
        } else if (cwd === root) {
            print_home();
        } else {
            const dir = cwd.substring(2);
            this.echo(directories[dir].join('<br><br>'), { raw: true });
        }
    }, 

    credits() {
        return [
            '',
            '<white>Used libraries:</white>',
            '* <a href="https://terminal.jcubic.pl">jQuery Terminal</a>',
            '* <a href="https://github.com/patorjk/figlet.js/">Figlet.js</a>',
            '* <a href="https://github.com/jcubic/isomorphic-lolcat">Isomorphic Lolcat</a>',
            '* <a href="https://jokeapi.dev/">Joke API</a>',
            ''
        ].join('\n');
    },
    open(project) {
        if (!project) {
            this.error('Usage: open <project_name>');
            return;
        }
        
        for (const dir in directories) {
            const items = directories[dir];
            for (const item of items) {
                if (item.includes(project)) {
                    // Extract URL from the HTML string
                    const match = item.match(/href="([^"]+)"/);
                    if (match) {
                        window.location.href = match[1];
                        return;
                    }
                }
            }
        }
        this.error(`Project '${project}' not found`);
    },
};

const user = 'kesh';
const server = 'kesh.org';

// $.terminal.xml_formatter.tags.green = () => {
//     return `[[;#44D544;]`;
// };

function prompt() {
    return `<green>${user}@${server}</green>:<blue>${cwd}</blue>$ `;
}

const command_list = ['clear'].concat(Object.keys(commands));
const formatted_list = command_list.map(cmd => {
    return `<white class="command">${cmd}</white>`;
});

const help = formatter.format(formatted_list);

const any_command_re = new RegExp(`^\s*(${command_list.join('|')})`);

const re = new RegExp(`^\s*(${command_list.join('|')}) (.*)`);

$.terminal.new_formatter(function(string) {
    return string.replace(re, function(_, command, args) {
        return `<white>${command}</white> <aqua>${args}</aqua>`;
    });
});

figlet.defaults({ fontPath: 'https://unpkg.com/figlet/fonts' });
figlet.preloadFonts([font], ready);

function getProjectNames() {
    const projects = [];
    for (const dir in directories) {
        const items = directories[dir];
        for (const item of items) {
            // Extract project name from the link
            const match = item.match(/>([^<]+)</);
            if (match && match[1] !== 'p5js_projects') {
                projects.push(match[1]);
            }
        }
    }
    return projects;
}

const term = $('body').terminal(commands, {
    greetings: false,
    checkArity: false,
    exit: false,
    animate() { 
        term.echo(animation)
    },
    completion(string) {
        // in every function we can use `this` to reference term object
        const cmd = this.get_command();
        // we process the command to extract the command name
        // and the rest of the command (the arguments as one string)
        const { name, rest } = $.terminal.parse_command(cmd);
        if (['cd', 'ls'].includes(name)) {
            if (rest.startsWith('~/')) {
                return dirs.map(dir => `~/${dir}`);
            }
            if (rest.startsWith('../') && cwd != root) {
                return dirs.map(dir => `../${dir}`);
            }
            if (cwd === root) {
                return dirs;
            }
        }
        if (name === 'open') {
            return getProjectNames();
        }
        return Object.keys(commands);
    },
    prompt
});



term.on('click', '.command', function() {
    const command = $(this).text();
    term.exec(command);
 });

function ready() {
    term.echo(() => {
      const ascii = rainbow(render('Kesh\'s Code Art'));
      return `${ascii}\n\n<white>hello! this is the landing page for my coding based art projects.</white>\
      \nmost of the projects are experiments with audioreactive visuals,
       using some snippets from recordings that i have made.
       try typing 'help' in the terminal to navigate :)\n
       or, if you are lost, type back to go back to the previous page`;
    });
    term.css("font-size", "20px")
 }
 
 function rainbow(string) {
    return lolcat.rainbow(function(char, color) {
        char = $.terminal.escape_brackets(char);
        return `[[;${hex(color)};]${char}]`;
    }, string).join('\n');
}

function hex(color) {
    return '#' + [color.red, color.green, color.blue].map(n => {
        return n.toString(16).padStart(2, '0');
    }).join('');
}

function render(text) {
    const cols = term.cols();
    return figlet.textSync(text, {
        font: font,
        width: cols,
        whitespaceBreak: true
    });
}
