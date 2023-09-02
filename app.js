
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from 'lodash';
const { Schema } = mongoose;


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const password = "Xn0rOQRxoxLAZ3GW"
mongoose.connect(`mongodb+srv://codetrsh:${password}@cluster0.buzakrk.mongodb.net/todolistDB`, {
  useNewUrlParser: true,
});

// creates the schema
const itemsSchema = new Schema ({
  name: String,
});

// Creates the collection. 
// Models Captilized first letter, they are classes I think, mongoose always turns them into plural
const Item = mongoose.model("Item", itemsSchema);

// Adds items (documents) to collections named Items in the db
  const item1 = new Item ({
    name: "Welcom to your todo list",
  });
  const item2 = new Item ({
    name: "Hit the + to add new items",
  });
  const item3 = new Item ({
    name: "<-- to delete an item",
  });


const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model('List', listSchema)
// console.log('List before the first get:', List)


app.get("/", async function(req, res) {
    try {
      const foundItems = await Item.find()
      console.log('founditems on first get:', foundItems)

      //Inserts items in DB if no items exist
      if(foundItems.length === 0){
        // Item.insertMany(defaultItems)
        // .then(()=> console.log("Success, items inserted!"))
        // .catch((error)=> console.log(error));
        // res.redirect('/');

        Item.insertMany(defaultItems);
        const list = new List({
          name: "Today",
          items: defaultItems
        });

        await list.save()
        console.log("items inserted and first List created with today title:")
        // res.redirect('/')
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }else{
        // // just prints to the console, nothing more
        // foundItems.forEach((item) => console.log(item.name));
        //sends the foundItems object to the list.ejs as an object! The loop on the list happens there!
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    } catch (error) {
      console.log(error)
    }

    console.log('finish first get! Should stop here---------------------')
});


app.get('/:customListName', async (req, res) => {

  try {
    
    // console.log('customListName:', req.params.customListName)

    if(!(req.params.customListName === "favicon.ico")){
      const customListName = _.capitalize(req.params.customListName);
      const foundList = await List.findOne({name: customListName})
      
      console.log('should not run at first hit ')
      // console.log('after lodash customListName:', customListName)
      // console.log('this foundList', foundList)
        
        if(!foundList){
          // Create new list
          console.log('creating one')
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save()
          res.redirect('/' + customListName);
        }else{
          //Show Existing list
          console.log('list exists')
          console.log('foundList.name:', foundList.name)
          res.render('list', {listTitle: foundList.name, newListItems: foundList.items})
        }
    }
   
    

  } catch (error) {
    console.log(error)
  }
  
})

app.post("/", async function(req, res){
  try {
    // gets the value from the input field after the + button is submitted
    const itemName = req.body.newItem;
    //req.body.list comes from the list.ejs file and = the value stablished there. value="<%= listTitle %>"
    const listName = req.body.list;
    // console.log('this is the value of listName:', listName)
    //creates new document (mongoose uses the name "document" for the items inserted into the collections)
    const item = new Item ({
      name: itemName,
    });

    if(listName === "Today"){
      item.save();
      res.redirect('/');
    }else{
      const foundList = await List.findOne({name: listName});
      // console.log('this is foundList:', foundList)
      foundList.items.push(item)
      foundList.save()
      res.redirect('/' + listName)
    }

  } catch (error) {
    
  }


});

app.post('/delete', async function(req, res) {
  console.log('-----------')
  try {
    console.log('this is req.body for delete:', req.body)
    const checkedItemId = req.body.checkbox; // = { checkbox: '64efda8daf57761d554f6ff3' }
    const listName = req.body.listName;
    console.log('this is the list name for Delete:', listName)
    if(listName === "Today"){
      await Item.findByIdAndRemove({_id: checkedItemId})
      console.log("Succesfully deleted checked Items")
      res.redirect('/')
    }else{
      const foundList = await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
      console.log('this is delete foundlist.items:', foundList.items) //foundlist.items = array i want
      res.redirect('/' + listName)
    }

  } catch (error) {
    console.log(error)
  }

})



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});



// in case I need the entire code again 
// https://www.appbrewery.co/p/web-development-course-resources