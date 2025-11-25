const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // Custom Menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Import',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-import');
          }
        },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow.webContents.send('menu-export');
          }
        },
        { type: 'separator' },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Change Background Color',
          submenu: [
            {
              label: 'Blue-Gray (Default)',
              click: () => {
                mainWindow.webContents.send('change-background-color', '5A6E7F');
              }
            },
            { type: 'separator' },
            {
              label: 'White',
              click: () => {
                mainWindow.webContents.send('change-background-color', 'FFF');
              }
            },
            {
              label: 'Gray',
              click: () => {
                mainWindow.webContents.send('change-background-color', 'DCDCDC');
              }
            },
            {
              label: 'Brown',
              click: () => {
                mainWindow.webContents.send('change-background-color', '5E2F0D');
              }
            },
            {
              label: 'Black',
              click: () => {
                mainWindow.webContents.send('change-background-color', '000000');
              }
            },
            { type: 'separator' },
            {
              label: 'Blue',
              click: () => {
                mainWindow.webContents.send('change-background-color', '0F4C81');
              }
            },
            {
              label: 'Green',
              click: () => {
                mainWindow.webContents.send('change-background-color', '0A5D0A');
              }
            },
            {
              label: 'Red',
              click: () => {
                mainWindow.webContents.send('change-background-color', '8B0000');
              }
            },
            {
              label: 'Orange',
              click: () => {
                mainWindow.webContents.send('change-background-color', 'FF7B00');
              }
            },
            {
              label: 'Teal',
              click: () => {
                mainWindow.webContents.send('change-background-color', '339999');
              }
            },
            {
              label: 'Yellow',
              click: () => {
                mainWindow.webContents.send('change-background-color', 'FFE114');
              }
            },
            {
              label: 'Purple',
              click: () => {
                mainWindow.webContents.send('change-background-color', '800080');
              }
            },
            {
              label: 'Pink',
              click: () => {
                mainWindow.webContents.send('change-background-color', 'FFC0CB');
              }
            },
            { type: 'separator' },
            {
              label: 'Custom...',
              accelerator: 'F6',
              click: () => {
                mainWindow.webContents.send('open-custom-background-modal');
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Toggle Preview Mode',
          accelerator: 'F4',
          click: () => {
            mainWindow.webContents.send('menu-toggle-preview');
          }
        },
        {
          label: 'Toggle Full Screen',
          role: 'togglefullscreen',
          accelerator: 'F11'
        },
        { type: 'separator' },
        {
          label: 'Insert Symbols Using LaTeX',
          accelerator: 'F7', 
          click: () => {
            mainWindow.webContents.send('menu-insert-math-symbols');
          }
        },
        {
          label: 'Insert Custom Table',
          accelerator: 'F8',
          click: () => {
            mainWindow.webContents.send('menu-insert-custom-table');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Using the App',
          click: () => {
            dialog.showMessageBox({
              type: 'none',
              title: 'Using the App',
              detail: 
`The app consists of three main sections:
• Sidebar: Contains your notebooks and notes hierarchy
• Left pane (Editor): Where you type Markdown and LaTeX content
• Right pane (Preview): Shows the formatted result of your content

Sidebar Explained:
• "Add Notebook" button: Creates a top-level notebook to organize related notes
• "✎" button: Edit the title of the notebook or note
• "+" button: Add a new note within the selected notebook or note
• "-" button: Delete the notebook or note (moves to Trash)
• Arrow (▶/▼): Expand or collapse to show/hide nested notes
• Number in parentheses: Shows how many subnotes are contained directly under
• Drag and drop: Rearrange notes by dragging their headers

Steps to Create and Edit Notes:
1. Create a notebook using the "Add Notebook" button
2. Add notes to notebooks using the "+" button
3. Select a note by clicking its header (turns black when selected)
4. Type in the left editor pane using Markdown and LaTeX syntax
5. See the formatted result instantly in the right preview pane

Special Features:
• Toggle Preview Mode (F4): Show/hide the preview pane for a distraction-free writing experience
• Custom Background Color (F6): Use preset colors or enter a custom hex code for your background
• Insert Symbols Using LaTeX (F7): Open a searchable list of math symbols to insert into your notes
• Insert Custom Table (F8): Create tables with custom rows and columns using Markdown syntax`
            });
          }
        },
        {
          label: 'What is Markdown?',
          click: () => {
            dialog.showMessageBox({
              type: 'none',
              title: 'What is Markdown?',
              detail:
`Markdown is a lightweight markup language that lets you format text using simple, readable syntax. 

Basic Concept:
• Plain text format that's easy to read even without formatting
• Converts to HTML for display in the preview pane
• No need to use complex editors or know HTML

How to Use It:
• Type in the editor pane using special characters
• See formatted results instantly in the preview pane
• The text stays readable even without rendering

Common Formatting:
• # Heading (use # for headings of different levels)
• **Bold text** (surround with double asterisks)
• *Italic text* (surround with single asterisks)
• "-" Item (hyphen for bullet lists)
• 1. Item (numbers for ordered lists)
• [Link text](url) (for hyperlinks)`

            });
          }
        },
        {
          label: 'What is LaTeX?',
          click: () => {
            dialog.showMessageBox({
              type: 'none',
              title: 'What is LaTeX?',
              detail:
`LaTeX is a typesetting system commonly used for mathematical and scientific writing.

Basic Concept:
• A markup language that allows you to write complex mathematical expressions and symbols
• Used in academic papers, scientific publications, and technical documents
• In this app, we use a subset focused on math expressions

How to Use It:
• Symbols have a code you type in the editor pane (left) to make it render in the preview pane (right)
• Type \\ followed by the code and surround it with $ on both sides
• The "Insert Math Symbols Using LaTeX" option in the view menu inserts a symbol of your choice

Examples:
• To print √2: type $\\sqrt{2}$ 
• To print θ: type $\\theta$
• To print ±x²: type $\\pm{x^2}$

Common Uses:
• Complex equations and formulas
• Mathematical symbols not available on standard keyboards
• Professional-looking mathematical notation

Press F7 to open the LaTeX symbols list for quick insertion of symbols.`
            });
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            dialog.showMessageBox({
              type: 'none',
              title: 'Keyboard Shortcuts',
              detail:
`Application Shortcuts:
• Toggle Preview Mode: F4
• Custom Background Color: F6
• Insert Symbols Using LaTeX: F7
• Insert Custom Table: F8
• Toggle Full Screen: F11
• Import: Ctrl+I
• Export: Ctrl+Shift+E
• Print: Ctrl+P

Navigation:
• Use arrow keys to navigate through notes in sidebar
• Use Tab to indent list items
• Use Shift+Tab to outdent list items`
            });
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          accelerator: 'F1',
          click: () => {
            dialog.showMessageBox({
              type: 'none',
              title: 'About',
              message: 'Archive Notes\nVersion 1.0.0',
              detail: 'A feature-rich note-taking application with Markdown and LaTeX support.\n\nDesigned for students, researchers, and note-takers who need powerful formatting and math capabilities.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Save data
ipcMain.handle('save-data', async (event, data) => {
  try {
    const filePath = path.join(app.getPath('userData'), 'notes-data.json');
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Load data
ipcMain.handle('load-data', async () => {
  try {
    const filePath = path.join(app.getPath('userData'), 'notes-data.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export notes
ipcMain.handle('export-notes', async (event, data) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: path.join(app.getPath('documents'), 'notes-backup.json'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
      return { success: true };
    }
    return { success: false, error: 'Export cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Import notes
ipcMain.handle('import-notes', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (filePaths && filePaths[0]) {
      const data = fs.readFileSync(filePaths[0], 'utf-8');
      return { success: true, data: JSON.parse(data) };
    }
    return { success: false, error: 'Import cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
