require "rubygems"
require "sinatra"
set :public, Proc.new { File.join(root) }