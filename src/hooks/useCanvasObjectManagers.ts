import { useCallback } from 'react';
import { fabric } from 'fabric';

export function useCanvasObjectManagers(
    canvas: fabric.Canvas | null,
    baseWidth: number,
    baseHeight: number,
    onDesignChange?: (design: any) => void,
    design?: any,
    saveHistory?: (canvas: fabric.Canvas | null) => void
) {
    const addText = useCallback((type: 'heading' | 'subheading' | 'body') => {
        if (!canvas) return;
        const textbox = new fabric.Textbox(type === 'heading' ? 'Heading' : 'Text', {
            left: baseWidth / 2,
            top: baseHeight / 2,
            fontSize: type === 'heading' ? 80 : 40,
            fontFamily: design?.fontFamily || 'Inter',
            fill: design?.textColor || '#000000',
            originX: 'center',
            originY: 'center',
            name: 'user_added_text',
            editable: true,
            objectCaching: false,
            borderColor: '#FF3333',
            cornerStrokeColor: '#FF3333',
            cornerColor: '#ffffff',
            cornerSize: 28,
            borderScaleFactor: 4,
            transparentCorners: false,
            padding: 4,
            lineHeight: 1,
            cornerStyle: 'circle'
        });
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        canvas.requestRenderAll();
        saveHistory?.(canvas);
    }, [canvas, baseWidth, baseHeight, design, saveHistory]);

    const addIcon = useCallback((iconName: string) => {
        if (!canvas || !fabric.Path) return;

        const iconPaths: Record<string, string> = {
            phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
            mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
            location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
            star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7 Z',
            globe: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20 M2 12h20',
            clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2',
            calendar: 'M3 4h18v18H3V4z M16 2v4 M8 2v4 M3 10h18',
            user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
            building: 'M2 6h20v16H2V6z M10 2v4 M14 2v4 M18 2v4 M6 2v4 M2 22v-4 M22 22v-4',
            facebook: 'M15.12 10.353h-2.803v-1.85c0-.813.539-.999.925-.999.385 0 2.39 0 2.39 0V4.097L12.55 4.09C9.13 4.09 8.356 6.64 8.356 8.328v2.025h-2.01v3.425h2.01v9.64h4.084V13.78H15.12l.465-3.427z',
            instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
            x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z',
            linkedin: 'M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z',
            youtube: 'M8 5v14l11-7z',
            whatsapp: 'M8.88595 7.16985C9.06891 7.17475 9.27175 7.18465 9.46474 7.61303C9.59271 7.89821 9.80829 8.42321 9.9839 8.85087C10.1206 9.18366 10.233 9.45751 10.2611 9.51356C10.3254 9.64156 10.365 9.78926 10.2809 9.96156C10.271 9.98188 10.2617 10.0013 10.2526 10.02C10.1852 10.16 10.1372 10.2597 10.0237 10.3899C9.97709 10.4435 9.9285 10.5022 9.88008 10.5607C9.79494 10.6636 9.71035 10.7658 9.63785 10.838C9.50924 10.9659 9.37563 11.1039 9.52402 11.3599C9.6725 11.6159 10.1919 12.4579 10.9587 13.1373C11.783 13.8712 12.4998 14.1805 12.8622 14.3368C12.9325 14.3672 12.9895 14.3918 13.0313 14.4126C13.2886 14.5406 13.4419 14.5209 13.5903 14.3486C13.7388 14.1762 14.2334 13.6001 14.4066 13.3441C14.5748 13.0881 14.7479 13.1275 14.9854 13.2161C15.2228 13.3047 16.4892 13.9251 16.7464 14.0531C16.7972 14.0784 16.8448 14.1012 16.8889 14.1224C17.0678 14.2082 17.1895 14.2665 17.2411 14.3535C17.3054 14.4618 17.3054 14.9739 17.0927 15.5746C16.8751 16.1752 15.8263 16.7513 15.3514 16.7956C15.3064 16.7999 15.2617 16.8053 15.2156 16.8108C14.7804 16.8635 14.228 16.9303 12.2596 16.1555C9.83424 15.2018 8.23322 12.8354 7.90953 12.357C7.88398 12.3192 7.86638 12.2932 7.85698 12.2806L7.8515 12.2733C7.70423 12.0762 6.80328 10.8707 6.80328 9.62685C6.80328 8.43682 7.38951 7.81726 7.65689 7.53467C7.67384 7.51676 7.6895 7.50021 7.70366 7.48494C7.94107 7.22895 8.21814 7.16495 8.39125 7.16495C8.56445 7.16495 8.73756 7.16495 8.88595 7.16985Z',
            whatsapp_bubble: 'M2.18418 21.3314C2.10236 21.6284 2.37285 21.9025 2.6709 21.8247L7.27824 20.6213C8.7326 21.409 10.37 21.8275 12.0371 21.8275H12.0421C17.5281 21.8275 22 17.3815 22 11.9163C22 9.26735 20.966 6.77594 19.0863 4.90491C17.2065 3.03397 14.7084 2 12.042 2C6.55607 2 2.08411 6.44605 2.08411 11.9114C2.08348 13.65 2.5424 15.3582 3.41479 16.8645L2.18418 21.3314Z'
        };

        const iconConfig: Record<string, {
            shape: 'circle' | 'roundedSquare' | 'bubble' | 'roundedRect',
            color: string,
            useGradient?: boolean
        }> = {
            facebook: { shape: 'circle', color: '#1877F2' },
            instagram: { shape: 'roundedSquare', color: '#E4405F', useGradient: true },
            x: { shape: 'circle', color: '#000000' },
            linkedin: { shape: 'circle', color: '#0A66C2' },
            youtube: { shape: 'roundedRect', color: '#FF0000' },
            whatsapp: { shape: 'bubble', color: '#25D366' }
        };

        const pathData = iconPaths[iconName] || iconPaths['star'];
        const config = iconConfig[iconName];

        if (config) {
            let background: fabric.Object;
            const commonProps = { left: 0, top: 0, originX: 'center', originY: 'center' };

            if (config.shape === 'roundedRect' && iconName === 'youtube') {
                background = new fabric.Rect({
                    ...commonProps,
                    width: 100, height: 70, rx: 15, ry: 15, fill: config.color,
                    name: 'icon_bg'
                });
            } else if (config.shape === 'roundedSquare') {
                background = new fabric.Rect({
                    ...commonProps,
                    width: 80, height: 80, rx: 18, ry: 18, fill: config.color,
                    name: 'icon_bg'
                });
                if (config.useGradient && iconName === 'instagram') {
                    const gradient = new fabric.Gradient({
                        type: 'linear',
                        coords: { x1: -40, y1: 40, x2: 40, y2: -40 },
                        colorStops: [
                            { offset: 0, color: '#f09433' },
                            { offset: 0.25, color: '#e6683c' },
                            { offset: 0.5, color: '#dc2743' },
                            { offset: 0.75, color: '#cc2366' },
                            { offset: 1, color: '#bc1888' }
                        ]
                    });
                    background.set('fill', gradient);
                }
            } else if (config.shape === 'bubble' && iconName === 'whatsapp') {
                background = new fabric.Path(iconPaths.whatsapp_bubble, {
                    ...commonProps,
                    fill: config.color,
                    scaleX: 4, scaleY: 4,
                    name: 'icon_bg'
                });
            } else {
                background = new fabric.Circle({ ...commonProps, radius: 40, fill: config.color, name: 'icon_bg' });
            }

            const logoPath = new fabric.Path(pathData, {
                ...commonProps,
                fill: '#ffffff',
                stroke: 'transparent',
                name: 'icon_logo',
                scaleX: iconName === 'facebook' ? 2.8 : (iconName === 'whatsapp' ? 4 : (iconName === 'x' ? 1.8 : 2.2)),
                scaleY: iconName === 'facebook' ? 2.8 : (iconName === 'whatsapp' ? 4 : (iconName === 'x' ? 1.8 : 2.2))
            });

            if (iconName === 'facebook') logoPath.set({ left: 3, top: 4 });
            if (iconName === 'whatsapp') logoPath.set({ left: -0.5, top: -1.5 });
            if (iconName === 'x') logoPath.set({ left: 0, top: 0 });
            if (iconName === 'youtube') logoPath.set({ scaleX: 3.5, scaleY: 3.5, left: 2 });

            const group = new fabric.Group([background, logoPath], {
                left: baseWidth / 2, top: baseHeight / 2,
                originX: 'center', originY: 'center',
                name: `social_${iconName}`
            });

            canvas.add(group);
            canvas.setActiveObject(group);
        } else {
            const iconPath = new fabric.Path(pathData, {
                left: baseWidth / 2, top: baseHeight / 2,
                originX: 'center', originY: 'center',
                fill: 'transparent', stroke: design?.textColor || '#000000', strokeWidth: 2,
                scaleX: 3, scaleY: 3, name: 'user_added_icon'
            });
            canvas.add(iconPath);
            canvas.setActiveObject(iconPath);
        }
        canvas.requestRenderAll();
        saveHistory?.(canvas);
    }, [canvas, baseWidth, baseHeight, design, saveHistory]);

    const addShape = useCallback((type: string) => {
        if (!canvas) return;
        let shape: fabric.Object;
        const common = { left: baseWidth / 2, top: baseHeight / 2, fill: '#7D2AE8', originX: 'center', originY: 'center', name: 'user_added_shape' };

        if (type === 'circle') shape = new fabric.Circle({ ...common, radius: 80 });
        else if (type === 'triangle') shape = new fabric.Triangle({ ...common, width: 150, height: 130 });
        else if (type === 'line') shape = new fabric.Rect({ ...common, width: 200, height: 4 });
        else if (type === 'star') {
            const points = [{ x: 0, y: -100 }, { x: 22, y: -30 }, { x: 95, y: -30 }, { x: 36, y: 13 }, { x: 59, y: 81 }, { x: 0, y: 38 }, { x: -59, y: 81 }, { x: -36, y: 13 }, { x: -95, y: -30 }, { x: -22, y: -30 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 0.8, scaleY: 0.8 });
        }
        else if (type === 'hexagon') {
            const points = [{ x: 50, y: -86.6 }, { x: 100, y: 0 }, { x: 50, y: 86.6 }, { x: -50, y: 86.6 }, { x: -100, y: 0 }, { x: -50, y: -86.6 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 0.8, scaleY: 0.8 });
        }
        else if (type === 'pentagon') {
            const points = [{ x: 0, y: -50 }, { x: 47.5, y: -15.5 }, { x: 29.4, y: 40.5 }, { x: -29.4, y: 40.5 }, { x: -47.5, y: -15.5 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 1.5, scaleY: 1.5 });
        }
        else if (type === 'arrow') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'arrow-left') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, angle: 180, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'arrow-up') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, angle: -90, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'arrow-down') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, angle: 90, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'chevron') {
            const points = [{ x: 0, y: -50 }, { x: 50, y: 0 }, { x: 0, y: 50 }, { x: -40, y: 50 }, { x: 10, y: 0 }, { x: -40, y: -50 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 1.5, scaleY: 1.5 });
        }
        else if (type === 'rect-sharp') {
            shape = new fabric.Rect({ ...common, width: 200, height: 150, rx: 0, ry: 0 });
        }
        else shape = new fabric.Rect({ ...common, width: 200, height: 150, rx: 10, ry: 10 });

        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
        saveHistory?.(canvas);
    }, [canvas, baseWidth, baseHeight, saveHistory]);

    const addImage = useCallback((url: string) => {
        fabric.Image.fromURL(url, (img) => {
            img.set({
                left: baseWidth / 2,
                top: baseHeight / 2,
                originX: 'center',
                originY: 'center',
                name: 'user_added_image'
            });
            canvas?.add(img);
            canvas?.setActiveObject(img);
            saveHistory?.(canvas);
        }, { crossOrigin: 'anonymous' });
    }, [canvas, baseWidth, baseHeight, saveHistory]);

    const addShapeSVG = useCallback((url: string) => {
        if (!canvas) return;

        fabric.loadSVGFromURL(url, (objects, options) => {
            const obj = fabric.util.groupSVGElements(objects, options);
            obj.set({
                left: baseWidth / 2,
                top: baseHeight / 2,
                originX: 'center',
                originY: 'center',
                name: 'user_added_shape_svg',
                fill: '#7D2AE8' // Default purple to make it visible
            });

            // Ensure internal paths inherit the fill if possible
            if ((obj as any)._objects) {
                (obj as any)._objects.forEach((child: any) => {
                    if (!child.fill || child.fill === 'currentColor') {
                        child.set('fill', '#7D2AE8');
                    }
                });
            }

            canvas.add(obj);
            canvas.setActiveObject(obj);
            canvas.requestRenderAll();
            saveHistory?.(canvas);
        }, undefined, { crossOrigin: 'anonymous' });
    }, [canvas, baseWidth, baseHeight, saveHistory]);

    return { addText, addIcon, addShape, addImage, addShapeSVG };
}
