// const { json } = require('express');
const express = require('express');
const router = express.Router();
const fetchuser = require("../middleware/fetchuser");
const Note= require('../models/Note')
const { body, validationResult } = require("express-validator");

//Route1: Get logged in users notes "/api/auth/fetchallnotes"/  login required
router.get('/fetchallnotes',fetchuser, async (req, res)=>{
  try {
    const notes= await Note.find({user: req.user.id})
    res.json(notes)   
    
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Something went wrong");
  }
 })
//2: Create new notes for users"/api/auth/createnote"/  login required
router.post('/addnote',fetchuser,  [
      body("title", "Title must be longer then 5 characters").isLength({
        min: 5,
      }),
      body("description", "Description must be longer then 5 characters").isLength({ min: 5 }),
    ],  async (req, res) => {
      const {title, description,tag}=req.body;
      const errors = validationResult(req);
      //if there are errors return bad request and the errors
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }else{
        try {
          
          const note= new Note({
            title, description,tag, user: req.user.id,
          })
          const noteSaved= await note.save()
          res.json(noteSaved)
        } catch (error) {
          console.error(error.message);
          res.status(500).send("Something went wrong");
        }
      }
 })
 //route3: update notes for users"/api/auth/updatenote"/  login required
 router.put('/updatenote/:id',fetchuser,  [
  body("title", "Title must be longer then 5 characters").isLength({
    min: 5,
  }),
  body("description", "Description must be longer then 5 characters").isLength({ min: 5 }),
],  async (req, res) => {
  try {
  const {title, description,tag}=req.body;
  // const title=req.body.etitle
  // const description=req.body.edescription
  // const tag=req.body.etag
  const newNote={};
  if (title){newNote.title= title}
  if (description){newNote.description= description}
  if (tag){newNote.tag= tag}
  // find the note to be updated and update it 
  let note = await Note.findById(req.params.id)

  if(!note){return res.status(404).send("Not found") }
  if(note.user.toString()!=req.user.id){
    return res.status(401).send("Not Allowed");
  }
  note = await Note.findByIdAndUpdate(req.params.id,{$set: newNote},{new:true})
  res.json(note)
}catch (error) {
  console.error(error.message);
  res.status(500).send("Something went wrong");
}
}
)
 //route4: delete notes for users"/api/auth/updatenote"/  login required
 router.delete('/deletenote/:id',fetchuser,  async (req, res) => {
 
  // find the note to be updated and delete it 
  try {

  let note = await Note.findById(req.params.id)
  if(!note){return res.status(404).send("Not found")}
  if(note.user.toString()!=req.user.id){
    return res.status(401).send("Not Allowed");
  }
  note = await Note.findByIdAndDelete(req.params.id)
  res.json({"success":"note has been deleted"})
}catch (error) {
  console.error(error.message);
  res.status(500).send("Something went wrong");
}
 }
 )
module.exports= router