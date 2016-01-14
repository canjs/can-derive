# The importance of "change" in client side web applications

## Introduction

The devices you use today to interact with the web communicate, processs, and 
store more information more quickly than ever before. Despite this fact 
one factor remains constant: The key to performance is efficiency. 

## How "change" influences efficiency

- Most API's provide a snapshot of a subset of data, or a firehose
- It's up to JS to manage the relationship between that data and your 
  application's logic
- Data transformations like (`.sort()`, `.map()`, and `.filter()`) are 
  a fast and easy way to manipulate that data
- Transformation means change; Changes that need to be made to the DOM
- Changes to the DOM are expensive
- In order to make efficient DOM manipulations, we need to know *specifically*
  what changed
- Determining *specifically* what changed is expensive

