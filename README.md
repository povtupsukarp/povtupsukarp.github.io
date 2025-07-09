# POE Harvest Color Maximizer - Improved Version

[![Update Lifeforce Prices](https://github.com/povtupsukarp/povtupsukarp.github.io/actions/workflows/update-prices.yml/badge.svg)](https://github.com/povtupsukarp/povtupsukarp.github.io/actions/workflows/update-prices.yml)

An optimized Path of Exile harvest calculator tool that helps players maximize their harvest farming efficiency through strategic color selection.

## Features

- **Step-by-step optimization**: Interactive decision making with optimal choice recommendations
- **Live market integration**: Real-time lifeforce prices from poe.ninja API
- **Lifeforce calculator**: Calculate harvest value in both chaos and divine orbs
- **Visual feedback**: Real-time pie chart visualization of loot distribution
- **Responsive design**: Works on desktop and mobile devices
- **Automated price updates**: GitHub Actions automatically fetch current market prices every 6 hours
- **Accessibility**: ARIA labels and keyboard navigation support
- **Error handling**: Comprehensive input validation and error messages
- **Performance optimized**: Efficient DOM manipulation and reduced memory usage

## Architecture

The application is built with a modular architecture:

### Core Modules

1. **CONFIG**: Application configuration and constants
2. **Utils**: Utility functions for validation, cloning, and HTML sanitization
3. **ScoreCalculator**: Tier scoring logic for different colors
4. **UI**: User interface management and DOM manipulation
5. **ChartModule**: Chart.js integration for data visualization
6. **Calculator**: Core harvest optimization algorithm
7. **HarvestApp**: Main application orchestrator

### Key Improvements

- **Modular design**: Clear separation of concerns
- **Error handling**: Comprehensive validation and user feedback
- **Performance**: Optimized cloning and DOM manipulation
- **Accessibility**: ARIA labels and semantic HTML
- **Responsive CSS**: Mobile-friendly design
- **Type safety**: Input validation and sanitization

## Usage

1. Set the number of harvest pairs (1-10)
2. Select the color you want to maximize
3. Configure each pair's colors using the dropdown menus
4. Click "Start Step-by-Step Analysis"
5. Follow the recommendations and indicate survival outcomes
6. View the final loot distribution in the summary table and chart

## Technical Details

### Performance Optimizations

- **Efficient cloning**: Custom `cloneGameState` function instead of deep JSON cloning
- **DOM fragments**: Batch DOM updates for better performance
- **Template strings**: Optimized HTML generation
- **Debounced input**: Prevents excessive re-rendering

### Security Features

- **HTML sanitization**: Prevents XSS attacks
- **Input validation**: Comprehensive data validation
- **Error boundaries**: Graceful error handling

### Browser Support

- Modern browsers supporting ES6+
- Chart.js for visualization
- Responsive design for mobile devices

## Development

The application uses vanilla JavaScript with modern ES6+ features. No build process is required - simply serve the files from a web server.

### File Structure

```
harvest_improved/
├── index.html          # Main HTML file
├── style.css           # Comprehensive CSS with responsive design
├── app.js             # Modular JavaScript application
└── README.md          # This documentation
```

## Original vs Improved

### Original Issues Fixed

- **Monolithic code**: Split into logical modules
- **Poor error handling**: Added comprehensive validation
- **Performance issues**: Optimized cloning and DOM manipulation
- **Accessibility**: Added ARIA labels and semantic HTML
- **Code organization**: Clear separation of concerns
- **No documentation**: Added inline comments and README

### Maintained Features

- All original functionality preserved
- Same user interface flow
- Compatible with existing usage patterns
- Same Path of Exile harvest mechanics

## License

This is an educational project for Path of Exile players.