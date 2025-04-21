#!/bin/bash
cat > ./views/about.ejs << "EOF"
<%- include("./layouts/main", { 
  title: "소개", 
  description: "DSH에듀 소개", 
  body: `<p>테스트</p>` 
}) %>
EOF
