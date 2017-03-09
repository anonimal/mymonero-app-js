// Copyright (c) 2014-2017, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const View = require('../../Views/View.web')
const ListView = require('../../Lists/Views/ListView.web')
const commonComponents_emptyScreens = require('../../MMAppUICommonComponents/emptyScreens.web')
const commonComponents_navigationBarButtons = require('../../MMAppUICommonComponents/navigationBarButtons.web')
//
const FundsRequestsListCellView = require('./FundsRequestsListCellView.web')
const FundsRequestDetailsView = require('./FundsRequestDetailsView.web')
//
const CreateRequestView = require('./CreateRequestView.web')
const StackAndModalNavigationView = require('../../StackNavigation/Views/StackAndModalNavigationView.web')
//
class FundsRequestsListView extends ListView
{
	constructor(options, context)
	{
		options.listController = context.fundsRequestsListController
		// ^- injecting dep so consumer of self doesn't have to
		super(options, context)
	}
	_setup_views()
	{
		const self = this
		self.currentlyPresented_CreateRequestView = null // zeroing for comparison
		super._setup_views()
		self._setup_emptyStateContainerView()
	}
	_setup_emptyStateContainerView()
	{
		const self = this
		const view = new View({}, self.context)
		self.emptyStateContainerView = view
		const layer = view.layer
		const margin_side = 15
		const marginTop = 56 - 41 // TODO: do this in VDA and query actual nav bar height
		const marginBottom = 14
		layer.style.marginTop = `${marginTop}px`
		layer.style.marginLeft = margin_side + "px"
		layer.style.width = `calc(100% - ${2 * margin_side}px)`
		layer.style.height = `calc(100% - ${marginTop + marginBottom}px)`
		{
			const emptyStateMessageContainerView = commonComponents_emptyScreens.New_EmptyStateMessageContainerView(
				"🤑", 
				"You haven't made any<br/>requests yet.",
				self.context,
				0,
				0
			)
			self.emptyStateMessageContainerView = emptyStateMessageContainerView
			view.addSubview(emptyStateMessageContainerView)
		}
		view.SetVisible = function(isVisible)
		{
			view.isVisible = isVisible
			if (isVisible) {
				if (layer.style.display !== "block") {
					layer.style.display = "block"
				}
			} else {
				if (layer.style.display !== "none") {
					layer.style.display = "none"
				}
			}
		}
		view.SetVisible(false)
		self.addSubview(view)
	}
	_setup_startObserving()
	{
		const self = this
		super._setup_startObserving()
		{ // walletAppCoordinator
			const emitter = self.context.walletAppCoordinator
			emitter.on(
				emitter.EventName_didTrigger_requestFundsFromContact(), // observe 'did' so we're guaranteed to already be on right tab
				function(contact)
				{
					self.presentCreateRequestView_withContact(contact)
				}
			)
		}
	}
	TearDown()
	{
		const self = this
		super.TearDown()
	}
	tearDownAnySpawnedReferencedPresentedViews()
	{ // overridden - called for us
		const self = this
		super.tearDownAnySpawnedReferencedPresentedViews()
		self._teardown_currentlyPresented_CreateRequestView()
	}
	_teardown_currentlyPresented_CreateRequestView()
	{
		const self = this
		if (self.currentlyPresented_CreateRequestView !== null) {
			self.currentlyPresented_CreateRequestView.TearDown() // might not be necessary but method guards itself
			self.currentlyPresented_CreateRequestView = null // must zero again and should free
		}
	}
	overridable_listCellViewClass()
	{ // override and return youir 
		return FundsRequestsListCellView
	}
	overridable_pushesDetailsViewOnCellTap()
	{
		return true
	}
	overridable_recordDetailsViewClass()
	{
		return FundsRequestDetailsView
	}
	//
	//
	// Runtime - Accessors - Navigation
	//
	Navigation_Title()
	{
		return "Monero Requests"
	}
	Navigation_New_RightBarButtonView()
	{
		const self = this
		const view = commonComponents_navigationBarButtons.New_RightSide_AddButtonView(self.context)
		view.layer.addEventListener(
			"click",
			function(e)
			{
				e.preventDefault()
				self.presentCreateRequestView_withoutValues()
				return false
			}
		)
		return view
	}
	//
	//
	// Runtime - Imperatives - Modal view presentation
	//
	presentCreateRequestView_withoutValues()
	{
		const self = this
		self._presentCreateRequestView_withOptions()
	}
	presentCreateRequestView_withContact(contact)
	{
		const self = this
		self._presentCreateRequestView_withOptions({
			fromContact: contact
		})
	}
	_presentCreateRequestView_withOptions(options_orNilForDefault)
	{
		const self = this
		const options = options_orNilForDefault || {}
		if (typeof self.currentlyPresented_CreateRequestView === 'undefined' || !self.currentlyPresented_CreateRequestView) {
			self.navigationController.PopToRootView(false) // not animated (since we're coming from another tab)
			//
			const view = new CreateRequestView(options, self.context)
			self.currentlyPresented_CreateRequestView = view
			const navigationView = new StackAndModalNavigationView({}, self.context)
			navigationView.SetStackViews([ view ])
			self.navigationController.PresentView(navigationView, true)
			//
			return
		}
		const fromContact = options.fromContact
		if (fromContact && typeof fromContact !== 'undefined') {
			self.currentlyPresented_CreateRequestView.AtRuntime_reconfigureWith_fromContact(fromContact)
		}
	}
	//
	//
	// Runtime - Delegation - UI building
	//
	overridable_willBuildUIWithRecords(records)
	{
		super.overridable_willBuildUIWithRecords(records)
		//
		const self = this
		// v--- we don't need this here as at present according to design the buttons don't change… just stays the 'Add' btn
		// self.navigationController.SetNavigationBarButtonsNeedsUpdate(false) // explicit: no animation
		const isEmptyVisible = records.length === 0
		{
			self.emptyStateContainerView.SetVisible(isEmptyVisible)
		}
		{ // style cellsContainerView
			const view = self.cellsContainerView
			const layer = view.layer
			if (isEmptyVisible == true) {
				layer.style.display = "none"
			} else {
				layer.style.margin = "16px 15px 15px 15px"
				layer.style.background = "#383638"
				layer.style.boxShadow = "0 0.5px 1px 0 #161416, inset 0 0.5px 0 0 #494749"
				layer.style.borderRadius = "5px"
				layer.style.overflow = "hidden" // to cut off hover style at borders
				layer.style.display = "block"
			}
		}
	}
}
module.exports = FundsRequestsListView