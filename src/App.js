import React, { useEffect } from "react";
import { withAuthenticator } from '@aws-amplify/ui-react';
import {AuthState, onAuthUIStateChange} from "@aws-amplify/ui-components";
import {AmplifyAuthenticator, AmplifySignOut, AmplifyGreetings} from "@aws-amplify/ui-react";
import { API, graphqlOperation} from "aws-amplify";
import { createNote, deleteNote, updateNote} from './graphql/mutations';
import { listNotes } from './graphql/queries';

const initialState = { id: '', note: '' }

function App() {
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();
  const [note, setNote] = React.useState(initialState)
  const [notes, setNotes] = React.useState([
    {
      id: 1,
      note: "hello word"
    }
  ])
  const hasExistingNote = () => {
    if(note && note.id) {
      const isNote = notes.findIndex(t=> t.id === note.id) > -1;
      return isNote;
    }
    return false;
  }
 const handleChangeNote = (event) => {
   if(note && note.id)
   setNote({note: event.target.value, id: note.id});
   else 
   setNote({note: event.target.value});

 }
 useEffect(() => {
  async function fetchMyNotes() {
    try {
    let response = await API.graphql(graphqlOperation(listNotes));
    setNotes(response.data.listNotes.items);
    }
    catch(e){
      console.log('fetch note error :', e);
    }
  }

  fetchMyNotes()
}, [])
 const handleAddNote = async (event) => {
   event.preventDefault();
   if(hasExistingNote()) {
     //update note
     console.log('note updated');
     handleUpdateNote();
   }
   else {
     try {
      const result = await API.graphql(graphqlOperation(createNote, {input: note} ));
      const newNote = result.data.createNote;
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      setNote(initialState);
     }
     catch(e){
       console.log('add note error :', e);
     }
   }
 }
 const handleUpdateNote = async () => {
  const result = await API.graphql(graphqlOperation(updateNote, {input: note} ));
  const updatedNote = result.data.updateNote;
  const index = notes.findIndex(t=> t.id === updatedNote.id)
  const updatedNotes = [...notes.slice(0, index), updatedNote, ...notes.slice(index+1)];
  setNotes(updatedNotes);
  setNote(initialState);

 }
 const handleDeleteNote = async (noteId) => {
   try {
     console.log('noteId', noteId);
      const result = await API.graphql(graphqlOperation(deleteNote, {input: {id: noteId}} ));
      const deletedNoteId = result.data.deleteNote.id;
      console.log('deleted note id', deletedNoteId);
      const updatedNotes = notes.filter(note=> note.id !== deletedNoteId);
      setNotes(updatedNotes);
   }
   catch(e) {
     console.log('delete note error :', e);
   }
   
 }
 const handleSetNote = (item) => setNote(item);

  React.useEffect(() => {
    return onAuthUIStateChange((nextAuthState, authData) => {
      setAuthState(nextAuthState);
      setUser(authData);
    });
  }, []);
  return authState === AuthState.SignedIn && user ?
   (
     <div>
    <AmplifyGreetings username={user.username}></AmplifyGreetings>
    <div className="flex flex-column 
    items-center justify-center pa3 bg-washed-red">
        
         <h1 className="code f2-l">Amplify NoteTaker</h1>
        <form className="mb3" onSubmit={handleAddNote}>
          <input type="text" className="pa2 f4" placeholder="write your note" onChange={handleChangeNote} value={note.note}></input>
          <button className="pa2 f4" type="submit">Add Note</button>
        </form>
        <div>
            {notes.map(item => (
              <div key={item.id} className="flex item-center">
                <li className="list pa1 f3" onClick={() => handleSetNote(item)}>
                  {item.note}
                </li>
                <button onClick={ () => handleDeleteNote(item.id)}  className="bg-transparent bn f4">
                  <span>&times;</span>
                </button>

              </div>
            ))}
        </div>
    </div></div>) :(
    <AmplifyAuthenticator/>
  );
}

export default App;
