export const parseSchematic = (text) => {
    const lines = text.split('\n');
    const data = {
        components: [],
        wires: [],
        labels: [],
        power: [],
        title: '',
        date: '',
        rev: '',
        comp: ''
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();

        // Parse header info
        if (line.startsWith('Title ')) {
            data.title = line.substring(7, line.length - 1);
        } else if (line.startsWith('Date ')) {
            data.date = line.substring(6, line.length - 1);
        } else if (line.startsWith('Rev ')) {
            data.rev = line.substring(5, line.length - 1);
        } else if (line.startsWith('Comp ')) {
            data.comp = line.substring(6, line.length - 1);
        }

        // Parse components
        if (line.startsWith('$Comp')) {
            const comp = { type: 'component', pins: [], fields: [] };
            i++;
            while (i < lines.length && !lines[i].trim().startsWith('$EndComp')) {
                const cLine = lines[i].trim();
                if (cLine.startsWith('L ')) {
                    const parts = cLine.split(' ');
                    comp.library = parts[1];
                    comp.name = parts[2];
                } else if (cLine.startsWith('P ')) {
                    const parts = cLine.split(' ');
                    comp.x = parseInt(parts[1]);
                    comp.y = parseInt(parts[2]);
                } else if (cLine.startsWith('F ')) {
                    const match = cLine.match(/F (\d+) "([^"]*)" ([HV]) (\d+) (\d+)/);
                    if (match) {
                        comp.fields.push({
                            index: parseInt(match[1]),
                            text: match[2],
                            orientation: match[3],
                            x: parseInt(match[4]),
                            y: parseInt(match[5])
                        });
                    }
                }
                i++;
            }
            data.components.push(comp);
        }

        // Parse wires
        if (line.startsWith('Wire Wire Line')) {
            i++;
            const wireLine = lines[i].trim();
            const parts = wireLine.split(/\s+/);
            if (parts.length >= 4) {
                data.wires.push({
                    x1: parseInt(parts[0]),
                    y1: parseInt(parts[1]),
                    x2: parseInt(parts[2]),
                    y2: parseInt(parts[3])
                });
            }
        }

        // Parse text labels
        if (line.startsWith('Text GLabel')) {
            const parts = line.split(/\s+/);
            if (parts.length >= 5) {
                data.labels.push({
                    x: parseInt(parts[2]),
                    y: parseInt(parts[3]),
                    text: parts[7] || '',
                    orientation: parseInt(parts[4])
                });
            }
        }

        // Parse power symbols
        if (line.startsWith('$Comp') || line.includes('#PWR')) {
            const pwrMatch = line.match(/#PWR(\d+)/);
            if (pwrMatch) {
                // Power symbol detected
            }
        }

        i++;
    }

    return data;
};
