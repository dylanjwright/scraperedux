var express = require("express");
var axios = require("axios");
var cheerio = require("cheerio");
var morgan = require("morgan");
var mongoose = require("mongoose");

var db = require("./models");

var app = express();

var PORT = 3000;

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraperedux";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/scrape", function(req, res) {
  axios.get("https://old.reddit.com").then(function(response) {
    var $ = cheerio.load(response.data);

    $("p.title").each(function(i, element) {
      var result = {};

      var title = $(element).children("a").text();
      var link = $(element).children("a").attr("href");

      result.title = title;
      result.link = link;

      db.Article.create(result)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          console.log(err);
        })
    });
    res.send("Successfully Scraped");
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("Listening on port: " + PORT);
});
